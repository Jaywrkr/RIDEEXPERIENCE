// Config del sitio de registro. Editar antes de desplegar.
// Ver docs/PENDIENTES_CLIENTE.md.

window.SITIO_CONFIG = {
  // URL base de la API del backend (backend/), sin barra final.
  API_BASE_URL: 'https://rideexperience-api.vercel.app/api',

  // ID del evento (UUID) al que se registra la gente. Se obtiene creandolo
  // desde el panel administrativo (admin/) y copiando el "id" que
  // devuelve. Si se deja vacio, el sitio toma automaticamente el primer
  // evento que encuentre — sirve porque este sitio es de un solo evento
  // (A Todo Terreno / Shineray), pero conviene fijarlo explicitamente
  // para no depender del orden en base de datos.
  EVENTO_ID: '',
};
