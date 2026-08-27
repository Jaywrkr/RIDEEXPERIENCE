// Cliente minimo para hablar con la API REST (backend/, Semana 1).
// Sin build step ni dependencias, a proposito: el resto del sitio es
// HTML/CSS/JS plano, y el panel admin sigue esa misma linea.

// Por defecto apunta al backend ya desplegado en Vercel (deploy de
// prueba, ver docs/DESPLIEGUE_VERCEL.md). Para desarrollo local, definir
// window.API_BASE_URL = 'http://localhost:3000/api' antes de este script.
const API_BASE_URL = window.API_BASE_URL || 'https://rideexperience-api.vercel.app/api';
const TOKEN_KEY = 'rideexperience_admin_token';
const ADMIN_KEY = 'rideexperience_admin_info';

const Api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAutenticado() {
    return Boolean(this.getToken());
  },

  guardarSesion(accessToken, admin) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },

  cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },

  adminActual() {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async login(email, password) {
    return this._request('/auth/login', { method: 'POST', body: { email, password } });
  },

  async listarEventos() {
    return this._request('/eventos');
  },

  async crearEvento(datos) {
    return this._request('/eventos', { method: 'POST', body: datos, auth: true });
  },

  async actualizarEvento(eventoId, datos) {
    return this._request(`/eventos/${eventoId}`, { method: 'PATCH', body: datos, auth: true });
  },

  async listarAsistentes(eventoId) {
    return this._request(`/eventos/${eventoId}/asistentes`, { auth: true });
  },

  async totalAsistentes(eventoId) {
    return this._request(`/eventos/${eventoId}/asistentes/total`, { auth: true });
  },

  async alternarLlegada(eventoId, asistenteId) {
    return this._request(`/eventos/${eventoId}/asistentes/${asistenteId}/llegada`, {
      method: 'PATCH',
      auth: true,
    });
  },

  async eliminarAsistente(eventoId, asistenteId) {
    return this._request(`/eventos/${eventoId}/asistentes/${asistenteId}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async _request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (!token) throw new ApiError('No hay sesion activa.', 401);
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexion.', 0);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && auth) this.cerrarSesion();
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
