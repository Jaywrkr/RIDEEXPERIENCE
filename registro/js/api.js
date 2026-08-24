// Cliente HTTP minimo para el sitio publico de registro. Sin build step
// ni dependencias — misma linea que admin/js/api.js.

const Api = {
  baseUrl() {
    return window.SITIO_CONFIG.API_BASE_URL;
  },

  async obtenerEvento() {
    const configurado = window.SITIO_CONFIG.EVENTO_ID;
    if (configurado) {
      return this._request(`/eventos/${configurado}`);
    }
    const eventos = await this._request('/eventos');
    if (eventos.length === 0) {
      throw new ApiError('Todavia no hay ningun evento creado en el panel administrativo.', 404);
    }
    return eventos[0];
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

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
