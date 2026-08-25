(() => {
  if (!Api.isAutenticado()) {
    window.location.replace('index.html');
    return;
  }

  const admin = Api.adminActual();
  document.getElementById('nombre-admin').textContent = admin ? admin.nombre : '';

  document.getElementById('boton-salir').addEventListener('click', () => {
    Api.cerrarSesion();
    window.location.href = 'index.html';
  });

  const sinEventos = document.getElementById('sin-eventos');
  const bloqueStats = document.getElementById('bloque-stats');
  const formEvento = document.getElementById('form-evento');
  const tarjetaCrearEvento = document.getElementById('tarjeta-crear-evento');
  const mensajeErrorEvento = document.getElementById('mensaje-error-evento');
  const statTotal = document.getElementById('stat-total');
  const tablaBody = document.getElementById('tabla-asistentes-body');
  const tablaVacia = document.getElementById('tabla-vacia');

  // Este panel administra un solo evento (A Todo Terreno) — no hay
  // selector, siempre se trabaja sobre el primero (y unico) que exista.
  let eventoActual = null;

  // datetime-local <-> ISO. Los inputs trabajan en hora local del navegador;
  // el backend guarda/lee ISO 8601 (Prisma DateTime).
  function isoADatetimeLocal(isoString) {
    if (!isoString) return '';
    const fecha = new Date(isoString);
    const offset = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function datetimeLocalAIso(valor) {
    if (!valor) return null;
    return new Date(valor).toISOString();
  }

  function mostrarErrorEvento(texto) {
    mensajeErrorEvento.textContent = texto;
    mensajeErrorEvento.classList.add('visible');
  }

  function ocultarErrorEvento() {
    mensajeErrorEvento.classList.remove('visible');
  }

  function llenarFormEvento(evento) {
    document.getElementById('ev-nombre').value = evento.nombre || '';
    document.getElementById('ev-descripcion').value = evento.descripcion || '';
    document.getElementById('ev-lugar').value = evento.lugar || '';
    document.getElementById('ev-fecha-inicio').value = isoADatetimeLocal(evento.fechaInicio);
    document.getElementById('ev-fecha-fin').value = isoADatetimeLocal(evento.fechaFin);
    document.getElementById('ev-aviso-previo').value = isoADatetimeLocal(evento.fechaAvisoPrevio);
    document.getElementById('ev-aviso-final').value = isoADatetimeLocal(evento.fechaAvisoFinal);
  }

  function formatearFecha(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  async function cargarAsistentes(eventoId) {
    const [asistentes, total] = await Promise.all([
      Api.listarAsistentes(eventoId),
      Api.totalAsistentes(eventoId),
    ]);

    statTotal.textContent = total;

    tablaBody.innerHTML = '';
    if (asistentes.length === 0) {
      tablaVacia.classList.remove('oculto');
      return;
    }
    tablaVacia.classList.add('oculto');

    for (const asistente of asistentes) {
      const fila = document.createElement('tr');
      const claseEstado = asistente.estado === 'REGISTRADO' ? 'estado-registrado' : 'estado-cancelado';
      fila.innerHTML = `
        <td>${escapeHtml(asistente.nombre)}</td>
        <td>${escapeHtml(asistente.correo)}</td>
        <td>${escapeHtml(asistente.telefono)}</td>
        <td><span class="estado-badge ${claseEstado}">${asistente.estado}</span></td>
        <td>${formatearFecha(asistente.createdAt)}</td>
      `;
      tablaBody.appendChild(fila);
    }
  }

  function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  async function cargarEventos() {
    const eventos = await Api.listarEventos();

    if (eventos.length === 0) {
      eventoActual = null;
      sinEventos.classList.remove('oculto');
      formEvento.closest('.tarjeta').classList.add('oculto');
      bloqueStats.classList.add('oculto');
      tarjetaCrearEvento.classList.remove('oculto');
      return;
    }

    eventoActual = eventos[0];
    sinEventos.classList.add('oculto');
    formEvento.closest('.tarjeta').classList.remove('oculto');
    bloqueStats.classList.remove('oculto');
    // Ya existe A Todo Terreno: no hace falta volver a mostrar el
    // formulario de creacion.
    tarjetaCrearEvento.classList.add('oculto');

    llenarFormEvento(eventoActual);
    try {
      await cargarAsistentes(eventoActual.id);
    } catch (error) {
      console.error(error);
    }
  }

  formEvento.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    ocultarErrorEvento();

    const botonGuardar = document.getElementById('boton-guardar-evento');
    botonGuardar.disabled = true;

    const datos = {
      nombre: document.getElementById('ev-nombre').value.trim(),
      descripcion: document.getElementById('ev-descripcion').value.trim() || undefined,
      lugar: document.getElementById('ev-lugar').value.trim(),
      fechaInicio: datetimeLocalAIso(document.getElementById('ev-fecha-inicio').value),
      fechaFin: datetimeLocalAIso(document.getElementById('ev-fecha-fin').value) || undefined,
      fechaAvisoPrevio: datetimeLocalAIso(document.getElementById('ev-aviso-previo').value) || undefined,
      fechaAvisoFinal: datetimeLocalAIso(document.getElementById('ev-aviso-final').value) || undefined,
    };

    try {
      eventoActual = await Api.actualizarEvento(eventoActual.id, datos);
    } catch (error) {
      mostrarErrorEvento(error.message || 'No se pudo guardar el evento.');
    } finally {
      botonGuardar.disabled = false;
    }
  });

  const formCrearEvento = document.getElementById('form-crear-evento');
  const mensajeErrorCrear = document.getElementById('mensaje-error-crear');

  formCrearEvento.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mensajeErrorCrear.classList.remove('visible');

    const datos = {
      nombre: document.getElementById('nuevo-nombre').value.trim(),
      lugar: document.getElementById('nuevo-lugar').value.trim(),
      fechaInicio: datetimeLocalAIso(document.getElementById('nuevo-fecha-inicio').value),
    };

    try {
      await Api.crearEvento(datos);
      formCrearEvento.reset();
      await cargarEventos();
    } catch (error) {
      mensajeErrorCrear.textContent = error.message || 'No se pudo crear el evento.';
      mensajeErrorCrear.classList.add('visible');
    }
  });

  cargarEventos().catch((error) => {
    console.error(error);
    if (error.status === 401) window.location.replace('index.html');
  });
})();
