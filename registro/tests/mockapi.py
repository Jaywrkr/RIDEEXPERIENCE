"""Backend de pruebas que replica el contrato real de backend/ (NestJS).

Reproduce fielmente:
  GET  /api/eventos                        -> lista de eventos
  POST /api/eventos/:id/asistentes         -> registro

y sus validaciones (CreateAsistenteDto + AsistentesService):
  - nombre 3..150
  - correo valido
  - telefono ^\\+?\\d{7,15}$
  - 409 si el correo ya esta registrado en el evento
  - 404 si el evento no existe
  - 400 con { message: [...] } igual que class-validator
"""
import json
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

EVENTO_ID = "11111111-2222-3333-4444-555555555555"
EVENTOS = [{
    "id": EVENTO_ID,
    "nombre": "A Todo Terreno",
    "fechaInicio": "2026-09-25T00:00:00.000Z",
    "fechaFin": "2026-09-27T00:00:00.000Z",
}]

registrados = {}       # correo -> asistente
lock = threading.Lock()
fallar_con = {"status": None}   # para simular caidas del servidor


def validar(dto):
    errores = []
    nombre = dto.get("nombre")
    if not isinstance(nombre, str) or not (3 <= len(nombre) <= 150):
        errores.append("nombre must be longer than or equal to 3 characters")
    correo = dto.get("correo")
    if not isinstance(correo, str) or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", correo or ""):
        errores.append("El correo electronico no es valido.")
    tel = dto.get("telefono")
    if not isinstance(tel, str) or not re.fullmatch(r"\+?\d{7,15}", tel or ""):
        errores.append("El telefono debe tener entre 7 y 15 digitos, puede incluir + al inicio.")
    return errores


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/_registrados":       # solo para las pruebas
            return self._json(200, list(registrados.values()))
        if fallar_con["status"]:
            return self._json(fallar_con["status"], {"message": "Fallo simulado."})
        if self.path == "/api/eventos":
            return self._json(200, EVENTOS)
        self._json(404, {"message": "No encontrado."})

    def do_POST(self):
        # Los endpoints de control van ANTES del interruptor de fallo: si no,
        # una vez simulada la caida no habria forma de volver a levantarla.
        if self.path == "/api/_reset":             # solo para las pruebas
            with lock:
                registrados.clear()
            return self._json(200, {"ok": True})
        if self.path == "/api/_fallar":
            n = int(self.headers.get("X-Status") or 0)
            fallar_con["status"] = n or None
            return self._json(200, {"ok": True})

        if fallar_con["status"]:
            return self._json(fallar_con["status"], {"message": "Fallo simulado."})

        m = re.fullmatch(r"/api/eventos/([^/]+)/asistentes", self.path)
        if not m:
            return self._json(404, {"message": "No encontrado."})

        evento_id = m.group(1)
        largo = int(self.headers.get("Content-Length") or 0)
        try:
            dto = json.loads(self.rfile.read(largo) or b"{}")
        except json.JSONDecodeError:
            return self._json(400, {"message": ["Cuerpo invalido."]})

        if evento_id != EVENTO_ID:
            return self._json(404, {"message": "El evento indicado no existe."})

        errores = validar(dto)
        if errores:
            return self._json(400, {"message": errores})

        with lock:
            # El correo es la clave natural desde que se retiro la cedula.
            clave = dto["correo"].lower()
            if clave in registrados:
                return self._json(409, {"message": "Este correo ya esta registrado en este evento."})
            numero = len(registrados) + 1
            asistente = {
                "id": f"asist-{numero}",
                "eventoId": evento_id,
                "nombre": dto["nombre"],
                "correo": dto["correo"],
                "telefono": dto["telefono"],
                "estado": "REGISTRADO",
                "createdAt": "2026-08-25T00:00:00.000Z",
                # Replica el correlativo real del backend (numero autoincremental
                # + offset 1000, ver asistentes.service.ts): primer registro = ATT-1001.
                "numero": numero,
                "codigo": f"ATT-{1000 + numero}",
            }
            registrados[clave] = asistente
        return self._json(201, asistente)


if __name__ == "__main__":
    import sys
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8931
    ThreadingHTTPServer(("127.0.0.1", puerto), H).serve_forever()
