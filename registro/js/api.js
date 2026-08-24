// Cliente HTTP minimo para el pasaporte de registro. Sin build step ni
// dependencias, igual que el resto del sitio.

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const Api = {
  baseUrl() {
    return window.SITIO_CONFIG.API_BASE_URL;
  },

  // Resuelve el ID del evento a inscribir: el fijado en config.js, o si
  // esta vacio, el primero que devuelva la API (este sitio es de un solo
  // evento).
  async obtenerEventoId() {
    const configurado = window.SITIO_CONFIG.EVENTO_ID;
    if (configurado) return configurado;

    const eventos = await this._request('/eventos');
    if (eventos.length === 0) {
      throw new ApiError('Todavia no hay ningun evento creado en el panel administrativo.', 404);
    }
    return eventos[0].id;
  },

  async registrar(eventoId, datos) {
    return this._request(`/eventos/${eventoId}/asistentes`, { method: 'POST', body: datos });
  },

  async _request(path, { method = 'GET', body } = {}) {
    let response;
    try {
      response = await fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexion.', 0);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const mensaje = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
      throw new ApiError(mensaje || 'Ocurrio un error inesperado.', response.status);
    }

    return data;
  },
};

// Expuesto explicitamente en window: passport.js se carga como modulo ES
// (import/export), y este script como script clasico — asignar a window
// evita cualquier ambiguedad sobre si el binding es visible entre ambos.
window.Api = Api;
