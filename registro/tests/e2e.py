"""Pruebas end-to-end del pasaporte de registro.

Corre el sitio estático y un backend de pruebas que replica el contrato
real de backend/ (mismas validaciones, mismos códigos de error), y maneja
el navegador de punta a punta: validación de campos, estados de error,
persistencia del borrador, navegación entre pasos y registro efectivo.

Uso:
    python3 tests/e2e.py            # todo
    python3 tests/e2e.py -k borrador

Requisitos: playwright (pip install playwright).
"""
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
PUERTO_SITIO = 8940
PUERTO_API = 8941
SITIO = f"http://127.0.0.1:{PUERTO_SITIO}/index.html"
API = f"http://127.0.0.1:{PUERTO_API}/api"

# Cédulas ecuatorianas con dígito verificador correcto.
CEDULA_OK = "1712345675"
CEDULA_OK_2 = "0901234567"
CEDULA_MAL_DV = "1712345670"      # dígito verificador incorrecto
CEDULA_PROV_MAL = "9912345675"    # provincia inexistente

resultados = []


def check(nombre, condicion, detalle=""):
    resultados.append((nombre, bool(condicion), detalle))
    marca = "PASA" if condicion else "FALLA"
    print(f"  [{marca}] {nombre}" + (f" — {detalle}" if detalle and not condicion else ""))


def reset_api():
    urllib.request.urlopen(urllib.request.Request(f"{API}/_reset", method="POST"), timeout=5).read()


def registrados():
    with urllib.request.urlopen(f"{API}/_registrados", timeout=5) as r:
        return json.load(r)


def fallar_api(status):
    req = urllib.request.Request(f"{API}/_fallar", method="POST")
    req.add_header("X-Status", str(status or 0))
    urllib.request.urlopen(req, timeout=5).read()


def abrir(page, saltar_bienvenida=True):
    page.goto(SITIO, wait_until="load")
    page.wait_for_selector("#welcomeCta", state="visible")
    if saltar_bienvenida:
        page.click("#welcomeCta")
        page.wait_for_function("document.getElementById('welcome').hidden === true", timeout=8000)
        page.wait_for_timeout(150)


def ir_a_formulario(page):
    page.click("#coverCta")
    page.wait_for_selector("#cedula", state="visible", timeout=5000)


def llenar(page, cedula=CEDULA_OK, nombre="Jay Jaramillo",
           telefono="0991234567", email="jay@ejemplo.com"):
    page.fill("#cedula", cedula)
    page.fill("#nombre", nombre)
    page.fill("#telefono", telefono)
    page.fill("#email", email)


def avanzar_a_revision(page):
    page.click("text=Abrir pasaporte")
    page.wait_for_timeout(700)


# --------------------------------------------------------------------------


def t_flujo_feliz(page):
    print("\n[ Registro completo ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)
    llenar(page)
    avanzar_a_revision(page)

    check("el resumen muestra el nombre escrito",
          "Jay Jaramillo" in page.inner_text("#resumenNombre"),
          page.inner_text("#resumenNombre"))
    check("el resumen muestra la cédula escrita",
          CEDULA_OK in page.inner_text("#resumenCedula"),
          page.inner_text("#resumenCedula"))

    page.click(".btn-sellar")
    page.wait_for_selector("#confirmacion", state="visible", timeout=15000)

    guardados = registrados()
    check("el asistente quedó guardado en el backend", len(guardados) == 1,
          f"guardados={len(guardados)}")
    if guardados:
        a = guardados[0]
        check("se guardaron los 4 datos correctos",
              a["cedula"] == CEDULA_OK and a["nombre"] == "Jay Jaramillo"
              and a["correo"] == "jay@ejemplo.com" and a["telefono"] == "0991234567",
              json.dumps(a))

    check("la confirmación muestra el correo",
          "jay@ejemplo.com" in page.inner_text("#confCorreo"))
    check("la confirmación muestra un número de pasaporte",
          page.inner_text("#confSerial").startswith("AT26-"),
          page.inner_text("#confSerial"))


def t_campos_obligatorios(page):
    print("\n[ Campos obligatorios ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)
    avanzar_a_revision(page)

    check("no deja avanzar con el formulario vacío",
          page.is_visible("#cedula"),
          "avanzó sin datos")
    check("marca los 4 campos vacíos como inválidos",
          page.eval_on_selector_all("input.invalid", "e => e.length") == 4,
          f'invalidos={page.eval_on_selector_all("input.invalid", "e => e.length")}')
    check("muestra mensaje de error en cédula",
          page.inner_text("#err-cedula").strip() != "")


def t_formato_invalido_no_avanza(page):
    """Con la validación en el cliente, los datos mal formados ya no llegan
    al paso 3: se detienen en el campo. Antes esta prueba llegaba a pulsar
    el botón final, que es justo el recorrido que se quiso eliminar."""
    print("\n[ Formato inválido: se detiene en el paso 2 ]")
    casos = [
        ("cédula con dígito verificador malo", dict(cedula=CEDULA_MAL_DV), "err-cedula"),
        ("cédula de provincia inexistente", dict(cedula=CEDULA_PROV_MAL), "err-cedula"),
        ("correo mal formado", dict(email="esto-no-es-un-correo"), "err-email"),
        ("teléfono demasiado corto", dict(telefono="123"), "err-telefono"),
    ]
    for descripcion, campos, id_error in casos:
        reset_api()
        abrir(page)
        ir_a_formulario(page)
        llenar(page, **campos)
        page.click("text=Abrir pasaporte")
        page.wait_for_timeout(500)
        check(f"no avanza con {descripcion}", page.is_visible("#cedula"))
        check(f"señala el campo con {descripcion}",
              page.inner_text(f"#{id_error}").strip() != "")
        check(f"no registra nada con {descripcion}", len(registrados()) == 0)


def t_api_rechaza_formato_invalido():
    """El servidor es la autoridad final: aunque el cliente valide, la API
    tiene que rechazar por su cuenta lo que llegue mal formado (alguien
    puede llamarla directamente, sin pasar por el formulario)."""
    print("\n[ La API rechaza formatos inválidos por su cuenta ]")
    reset_api()
    base = dict(cedula=CEDULA_OK, nombre="Jay Jaramillo",
                correo="jay@ejemplo.com", telefono="0991234567")
    casos = [
        ("cédula con dígito verificador malo", dict(cedula=CEDULA_MAL_DV)),
        ("cédula de provincia inexistente", dict(cedula=CEDULA_PROV_MAL)),
        ("correo mal formado", dict(correo="no-es-correo")),
        ("teléfono demasiado corto", dict(telefono="123")),
        ("nombre demasiado corto", dict(nombre="Jo")),
    ]
    for descripcion, cambio in casos:
        cuerpo = json.dumps({**base, **cambio}).encode()
        req = urllib.request.Request(
            f"{API}/eventos/11111111-2222-3333-4444-555555555555/asistentes",
            data=cuerpo, method="POST",
            headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req, timeout=5)
            check(f"la API rechaza {descripcion}", False, "respondió 2xx")
        except urllib.error.HTTPError as e:
            check(f"la API rechaza {descripcion}", e.code == 400, f"HTTP {e.code}")
    check("ninguno de los inválidos quedó guardado", len(registrados()) == 0)


def t_cedula_duplicada(page):
    print("\n[ Cédula duplicada ]")
    reset_api()
    for intento in (1, 2):
        abrir(page)
        ir_a_formulario(page)
        llenar(page, cedula=CEDULA_OK_2, email=f"correo{intento}@ejemplo.com")
        avanzar_a_revision(page)
        page.click(".btn-sellar")
        if intento == 1:
            page.wait_for_selector("#confirmacion", state="visible", timeout=15000)
        else:
            page.wait_for_timeout(1500)

    err = page.inner_text("#err-sellar").strip()
    check("rechaza registrar dos veces la misma cédula",
          "registrada" in err.lower(), f"error='{err}'")
    check("no duplica el asistente en el backend", len(registrados()) == 1,
          f"guardados={len(registrados())}")


def t_servidor_caido(page):
    print("\n[ Servidor caído ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)
    llenar(page)
    avanzar_a_revision(page)
    fallar_api(500)
    try:
        page.click(".btn-sellar")
        page.wait_for_timeout(1500)
        check("informa el error cuando el servidor falla",
              page.inner_text("#err-sellar").strip() != "")
        check("permite reintentar tras un fallo del servidor",
              not page.is_disabled(".btn-sellar"))
    finally:
        fallar_api(0)

    # Reintento exitoso tras restablecerse el servidor.
    page.click(".btn-sellar")
    page.wait_for_selector("#confirmacion", state="visible", timeout=15000)
    check("el reintento funciona una vez que el servidor vuelve",
          len(registrados()) == 1, f"guardados={len(registrados())}")


def t_borrador(page):
    print("\n[ Borrador tras recargar ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)
    llenar(page)
    page.wait_for_timeout(400)

    abrir(page)
    ir_a_formulario(page)
    valores = page.evaluate("""() => ({
      cedula: document.getElementById('cedula').value,
      nombre: document.getElementById('nombre').value,
      telefono: document.getElementById('telefono').value,
      email: document.getElementById('email').value,
    })""")
    check("recuerda la cédula tras recargar", valores["cedula"] == CEDULA_OK, valores["cedula"])
    check("recuerda el nombre tras recargar", valores["nombre"] == "Jay Jaramillo", valores["nombre"])
    check("recuerda el teléfono tras recargar", valores["telefono"] == "0991234567", valores["telefono"])
    check("recuerda el correo tras recargar", valores["email"] == "jay@ejemplo.com",
          f'quedó vacío: "{valores["email"]}"')


def t_navegacion(page):
    print("\n[ Navegación entre pasos ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)
    check("el paso 2 muestra el formulario", page.is_visible("#cedula"))
    llenar(page)
    avanzar_a_revision(page)
    check("el paso 3 muestra la revisión", page.is_visible(".btn-sellar"))

    page.click("text=Atrás")
    page.wait_for_timeout(700)
    check("el botón Atrás vuelve al formulario", page.is_visible("#cedula"))
    check("Atrás conserva lo escrito",
          page.input_value("#cedula") == CEDULA_OK, page.input_value("#cedula"))


def t_sin_doble_envio(page):
    print("\n[ Doble clic en sellar ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)
    llenar(page)
    avanzar_a_revision(page)
    page.click(".btn-sellar", click_count=1)
    try:
        page.click(".btn-sellar", timeout=600)
    except Exception:
        pass
    page.wait_for_selector("#confirmacion", state="visible", timeout=15000)
    check("un doble clic no registra dos veces", len(registrados()) == 1,
          f"guardados={len(registrados())}")


def t_validacion_en_el_campo(page):
    """El error de formato debe aparecer junto al campo y en el momento,
    no dos pasos después al pulsar el botón final."""
    print("\n[ Validación en el campo ]")
    reset_api()
    abrir(page)
    ir_a_formulario(page)

    page.fill("#cedula", CEDULA_MAL_DV)
    page.click("#nombre")
    page.wait_for_timeout(250)
    check("avisa de la cédula inválida al salir del campo",
          page.inner_text("#err-cedula").strip() != "",
          "el error no apareció en el paso 2")

    page.fill("#cedula", "17123")
    page.click("#nombre")
    page.wait_for_timeout(200)
    check("dice cuántos dígitos faltan",
          "10" in page.inner_text("#err-cedula"), page.inner_text("#err-cedula"))

    page.fill("#cedula", CEDULA_OK)
    page.wait_for_timeout(200)
    check("el error se limpia al corregir, sin salir del campo",
          page.inner_text("#err-cedula").strip() == "")
    check("marca el campo como correcto",
          page.eval_on_selector("#cedula", "e=>e.classList.contains('is-ok')"))

    page.fill("#telefono", "123")
    page.click("#email")
    page.wait_for_timeout(200)
    check("avisa del teléfono mal formado en el campo",
          page.inner_text("#err-telefono").strip() != "")

    page.fill("#email", "no-es-correo")
    page.click("#nombre")
    page.wait_for_timeout(200)
    check("avisa del correo mal formado en el campo",
          page.inner_text("#err-email").strip() != "")

    page.fill("#nombre", "")
    page.click("text=Abrir pasaporte")
    page.wait_for_timeout(400)
    check("no deja avanzar con errores de formato", page.is_visible("#cedula"))
    check("enfoca el primer campo con problema",
          page.evaluate("()=>document.activeElement.id") == "nombre",
          page.evaluate("()=>document.activeElement.id"))


# Las pruebas que no necesitan navegador reciben None y lo ignoran.
PRUEBAS = [t_flujo_feliz, t_campos_obligatorios, t_validacion_en_el_campo,
           t_formato_invalido_no_avanza, t_cedula_duplicada, t_servidor_caido,
           t_borrador, t_navegacion, t_sin_doble_envio]
PRUEBAS_SIN_NAVEGADOR = [t_api_rechaza_formato_invalido]


def main():
    filtro = None
    if "-k" in sys.argv:
        filtro = sys.argv[sys.argv.index("-k") + 1]

    sitio = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PUERTO_SITIO)],
        cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    api = subprocess.Popen(
        [sys.executable, str(Path(__file__).parent / "mockapi.py"), str(PUERTO_API)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)

    errores_consola = []
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
            ctx = navegador.new_context(viewport={"width": 390, "height": 844})
            # config.js se carga como script clásico y asigna window.SITIO_CONFIG
            # incondicionalmente, así que inyectar la config antes no sirve: la
            # pisaría. Se sustituye el archivo entero, que además deja el resto
            # del camino real intacto (api.js lo sigue leyendo igual).
            ctx.route("**/js/config.js", lambda ruta: ruta.fulfill(
                status=200,
                content_type="application/javascript",
                body=f"window.SITIO_CONFIG={{API_BASE_URL:'{API}',EVENTO_ID:''}};"))
            # El service worker cachearía respuestas entre pruebas y las
            # volvería no reproducibles.
            ctx.route("**/sw.js", lambda ruta: ruta.fulfill(
                status=404, content_type="application/javascript", body=""))
            page = ctx.new_page()
            page.on("pageerror", lambda e: errores_consola.append(str(e)))

            for prueba in PRUEBAS:
                if filtro and filtro not in prueba.__name__:
                    continue
                try:
                    prueba(page)
                except Exception as e:
                    check(f"{prueba.__name__} corrió sin excepción", False, repr(e))

            navegador.close()

        for prueba in PRUEBAS_SIN_NAVEGADOR:
            if filtro and filtro not in prueba.__name__:
                continue
            try:
                prueba()
            except Exception as e:
                check(f"{prueba.__name__} corrió sin excepción", False, repr(e))
    finally:
        sitio.terminate()
        api.terminate()

    print("\n[ Errores de consola ]")
    check("ningún error de JavaScript durante todo el flujo",
          not errores_consola, "; ".join(errores_consola[:3]))

    fallidas = [n for n, ok, _ in resultados if not ok]
    print("\n" + "=" * 60)
    print(f"{len(resultados) - len(fallidas)}/{len(resultados)} comprobaciones pasan")
    if fallidas:
        print("\nFALLAN:")
        for n, ok, d in resultados:
            if not ok:
                print(f"  - {n}" + (f"  ({d})" if d else ""))
    print("=" * 60)
    return 1 if fallidas else 0


if __name__ == "__main__":
    sys.exit(main())
