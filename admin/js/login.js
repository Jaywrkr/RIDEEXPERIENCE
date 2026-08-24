(() => {
  const form = document.getElementById('form-login');
  const boton = document.getElementById('boton-login');
  const mensajeError = document.getElementById('mensaje-error');

  // Si ya hay sesion activa, saltar directo al panel.
  if (Api.isAutenticado()) {
    window.location.replace('dashboard.html');
    return;
  }

  function mostrarError(texto) {
    mensajeError.textContent = texto;
    mensajeError.classList.add('visible');
  }

  function ocultarError() {
    mensajeError.classList.remove('visible');
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    ocultarError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    boton.disabled = true;
    boton.textContent = 'Ingresando…';

    try {
      const { accessToken, admin } = await Api.login(email, password);
      Api.guardarSesion(accessToken, admin);
      window.location.href = 'dashboard.html';
    } catch (error) {
      mostrarError(error.message || 'No se pudo iniciar sesion.');
      boton.disabled = false;
      boton.textContent = 'Ingresar';
    }
  });
})();
