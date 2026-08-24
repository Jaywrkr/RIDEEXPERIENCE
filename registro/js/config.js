// Config del sitio de registro. Editar antes de desplegar cada evento.
// Ver docs/SEMANA_3.md → "Cosas que tenés que configurar vos" para el detalle.

window.SITIO_CONFIG = {
  // URL base de la API del backend (backend/), sin barra final.
  // Apunta al deploy de prueba en Vercel (ver docs/DESPLIEGUE_VERCEL.md).
  // En local: cambiar a 'http://localhost:3000/api'.
  API_BASE_URL: 'https://rideexperience-api.vercel.app/api',

  // ID del evento (UUID) que este sitio muestra e inscribe. Se obtiene
  // creandolo desde el panel administrativo (admin/) y copiando el "id"
  // que devuelve. Si se deja vacio, el sitio muestra automaticamente el
  // primer evento que encuentre — util en desarrollo, pero para
  // produccion conviene fijarlo explicitamente para no depender del
  // orden en base de datos.
  EVENTO_ID: '',
};
