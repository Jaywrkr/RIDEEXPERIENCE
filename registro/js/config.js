// Config del sitio de registro. Editar antes de desplegar cada evento.
// Ver docs/SEMANA_3.md → "Cosas que tenés que configurar vos" para el detalle.

window.SITIO_CONFIG = {
  // URL base de la API del backend (backend/), sin barra final.
  // En local: 'http://localhost:3000/api'. En produccion: la URL del
  // backend ya desplegado (ver docs/SEMANA_3.md).
  API_BASE_URL: 'http://localhost:3000/api',

  // ID del evento (UUID) que este sitio muestra e inscribe. Se obtiene
  // creandolo desde el panel administrativo (admin/) y copiando el "id"
  // que devuelve. Si se deja vacio, el sitio muestra automaticamente el
  // primer evento que encuentre — util en desarrollo, pero para
  // produccion conviene fijarlo explicitamente para no depender del
  // orden en base de datos.
  EVENTO_ID: '',
};
