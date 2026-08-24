(() => {
  const pantallaCarga = document.getElementById('pantalla-carga');
  const pantallaError = document.getElementById('pantalla-error');
  const textoErrorCarga = document.getElementById('texto-error-carga');
  const pantallaForm = document.getElementById('pantalla-form');
  const pantallaConfirmacion = document.getElementById('pantalla-confirmacion');

  const form = document.getElementById('form-registro');
  const botonRegistrar = document.getElementById('boton-registrar');
  const mensajeErrorForm = document.getElementById('mensaje-error-form');

  let eventoActual = null;

  function formatearFecha(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('es-EC', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  async function init() {
    try {
      eventoActual = await Api.obtenerEvento();
      document.getElementById('evento-nombre').textContent = eventoActual.nombre;
      document.getElementById('evento-lugar-fecha').textContent =
        `${eventoActual.lugar} · ${formatearFecha(eventoActual.fechaInicio)}`;

      if (eventoActual.descripcion) {
        const descripcion = document.getElementById('evento-descripcion');
        descripcion.textContent = eventoActual.descripcion;
        descripcion.classList.remove('oculto');
      }

      pantallaCarga.classList.add('oculto');
      pantallaForm.classList.remove('oculto');
    } catch (error) {
      pantallaCarga.classList.add('oculto');
      textoErrorCarga.textContent = error.message || 'No se pudo cargar la información del evento.';
      pantallaError.classList.remove('oculto');
    }
  }

  function mostrarErrorForm(texto) {
    mensajeErrorForm.textContent = texto;
    mensajeErrorForm.classList.add('visible');
  }

  function ocultarErrorForm() {
    mensajeErrorForm.classList.remove('visible');
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    ocultarErrorForm();

    const datos = {
      cedula: document.getElementById('cedula').value.trim(),
      nombre: document.getElementById('nombre').value.trim(),
      correo: document.getElementById('correo').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
    };

    botonRegistrar.disabled = true;
    botonRegistrar.textContent = 'Registrando…';

    try {
      await Api.registrar(eventoActual.id, datos);
      document.getElementById('correo-confirmado').textContent = datos.correo;
      pantallaForm.classList.add('oculto');
      pantallaConfirmacion.classList.remove('oculto');
    } catch (error) {
      mostrarErrorForm(error.message || 'No se pudo completar el registro.');
      botonRegistrar.disabled = false;
      botonRegistrar.textContent = 'Registrarme';
    }
  });

  init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // Instalacion como PWA es progresiva: si falla el registro, el
        // sitio sigue funcionando normalmente sin modo offline.
      });
    });
  }
})();
