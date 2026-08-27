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
  const statSemana = document.getElementById('stat-semana');
  const statHoy = document.getElementById('stat-hoy');
  const statFaltan = document.getElementById('stat-faltan');
  const statFaltanEtiqueta = document.getElementById('stat-faltan-etiqueta');
  const statLlegaron = document.getElementById('stat-llegaron');
  const tablaBody = document.getElementById('tabla-asistentes-body');
  const tablaVacia = document.getElementById('tabla-vacia');
  const tablaSinResultados = document.getElementById('tabla-sin-resultados');
  const buscador = document.getElementById('buscador-asistentes');
  const botonExportarCsv = document.getElementById('boton-exportar-csv');
  const dialogoEliminar = document.getElementById('dialogo-eliminar');
  const dialogoEliminarNombre = document.getElementById('dialogo-eliminar-nombre');
  const botonCancelarEliminar = document.getElementById('boton-cancelar-eliminar');
  const botonConfirmarEliminar = document.getElementById('boton-confirmar-eliminar');

  // Este panel administra un solo evento (A Todo Terreno) — no hay
  // selector, siempre se trabaja sobre el primero (y unico) que exista.
  let eventoActual = null;

  // Lista completa tal como vino del servidor: las metricas siempre se
  // calculan sobre esta, nunca sobre el resultado filtrado del buscador.
  let asistentesTodos = [];
  // Lo que efectivamente esta en pantalla ahora mismo (filtrado por el
  // buscador o no) -- es lo que exporta el boton de CSV, para poder
  // exportar justo el grupo que se esta mirando.
  let asistentesVisibles = [];
  let totalRegistrados = 0;

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

  // Fecha corta para la tabla: en una lista larga, la hora completa de
  // cada fila es ruido. La hora se conserva en el title, para quien la
  // necesite.
  function formatearFechaCorta(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-EC', {
      day: '2-digit', month: 'short', year: '2-digit',
    });
  }

  function inicialDe(nombre) {
    const limpio = (nombre || '').trim();
    return limpio ? limpio[0].toUpperCase() : '?';
  }

  /**
   * Metricas del evento. Se calculan sobre los asistentes que ya se
   * cargaron para la tabla, asi que no cuestan una peticion extra.
   */
  function pintarMetricas(asistentes, total, evento) {
    statTotal.textContent = total;

    const ahora = Date.now();
    const DIA = 24 * 60 * 60 * 1000;
    const inicioDeHoy = new Date();
    inicioDeHoy.setHours(0, 0, 0, 0);

    const enSemana = asistentes.filter(
      (a) => a.createdAt && ahora - new Date(a.createdAt).getTime() <= 7 * DIA
    ).length;
    const hoy = asistentes.filter(
      (a) => a.createdAt && new Date(a.createdAt).getTime() >= inicioDeHoy.getTime()
    ).length;

    statSemana.textContent = enSemana;
    statHoy.textContent = hoy;
    statLlegaron.textContent = asistentes.filter((a) => a.llegadaEn).length;

    // Cuenta atras hasta el evento. Cambia de etiqueta segun el momento,
    // para no mostrar "faltan -3 dias" una vez que ya paso.
    if (evento && evento.fechaInicio) {
      const inicio = new Date(evento.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const dias = Math.round((inicio.getTime() - inicioDeHoy.getTime()) / DIA);
      if (dias > 0) {
        statFaltan.textContent = dias;
        statFaltanEtiqueta.textContent = dias === 1 ? 'Día para el evento' : 'Días para el evento';
      } else if (dias === 0) {
        statFaltan.textContent = 'HOY';
        statFaltanEtiqueta.textContent = 'El evento es hoy';
      } else {
        statFaltan.textContent = Math.abs(dias);
        statFaltanEtiqueta.textContent = 'Días desde el evento';
      }
    } else {
      statFaltan.textContent = '—';
    }
  }

  // Coincide si el texto de busqueda aparece en nombre, correo o
  // telefono -- las tres formas en las que alguien en la puerta suele
  // buscar a una persona.
  function filtrar(asistentes, texto) {
    const q = texto.trim().toLowerCase();
    if (!q) return asistentes;
    return asistentes.filter((a) =>
      [a.nombre, a.correo, a.telefono].some((campo) => (campo || '').toLowerCase().includes(q))
    );
  }

  function renderizarTabla(asistentes) {
    asistentesVisibles = asistentes;
    tablaBody.innerHTML = '';

    if (asistentesTodos.length === 0) {
      tablaVacia.classList.remove('oculto');
      tablaSinResultados.classList.add('oculto');
      return;
    }
    tablaVacia.classList.add('oculto');

    if (asistentes.length === 0) {
      tablaSinResultados.classList.remove('oculto');
      return;
    }
    tablaSinResultados.classList.add('oculto');

    for (const asistente of asistentes) {
      const fila = document.createElement('tr');
      const claseEstado = asistente.estado === 'REGISTRADO' ? 'estado-registrado' : 'estado-cancelado';
      const llego = Boolean(asistente.llegadaEn);
      fila.innerHTML = `
        <td class="celda-codigo">${escapeHtml(asistente.codigo || '—')}</td>
        <td>
          <span class="celda-persona">
            <span class="inicial" aria-hidden="true">${escapeHtml(inicialDe(asistente.nombre))}</span>
            <span>${escapeHtml(asistente.nombre)}</span>
          </span>
        </td>
        <td class="celda-correo">${escapeHtml(asistente.correo)}</td>
        <td class="celda-tel">${escapeHtml(asistente.telefono)}</td>
        <td><span class="estado-badge ${claseEstado}">${asistente.estado}</span></td>
        <td class="celda-fecha" title="${escapeHtml(formatearFecha(asistente.createdAt))}">${escapeHtml(formatearFechaCorta(asistente.createdAt))}</td>
        <td>
          <button
            type="button"
            class="boton-llegada ${llego ? 'boton-llegada--hecho' : 'boton-llegada--pendiente'}"
            data-asistente-id="${escapeHtml(asistente.id)}"
            title="${llego ? escapeHtml(formatearFecha(asistente.llegadaEn)) : ''}"
          >${llego ? '✓ Llegó' : 'Marcar llegada'}</button>
        </td>
        <td class="celda-acciones">
          <button
            type="button"
            class="boton-eliminar"
            data-asistente-id="${escapeHtml(asistente.id)}"
            data-asistente-nombre="${escapeHtml(asistente.nombre)}"
            title="Eliminar asistente"
            aria-label="Eliminar a ${escapeHtml(asistente.nombre)}"
          >Eliminar</button>
        </td>
      `;
      tablaBody.appendChild(fila);
    }
  }

  function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  async function cargarAsistentes(eventoId, evento) {
    const [asistentes, total] = await Promise.all([
      Api.listarAsistentes(eventoId),
      Api.totalAsistentes(eventoId),
    ]);

    asistentesTodos = asistentes;
    totalRegistrados = total;
    pintarMetricas(asistentes, total, evento);
    renderizarTabla(filtrar(asistentesTodos, buscador.value));
  }

  buscador.addEventListener('input', () => {
    renderizarTabla(filtrar(asistentesTodos, buscador.value));
  });

  // Delegado en el tbody: las filas se reconstruyen enteras en cada
  // render, asi que un listener por boton se perderia.
  tablaBody.addEventListener('click', async (evento) => {
    const botonLlegada = evento.target.closest('.boton-llegada');
    if (botonLlegada && eventoActual) {
      const asistenteId = botonLlegada.dataset.asistenteId;
      botonLlegada.disabled = true;
      try {
        const actualizado = await Api.alternarLlegada(eventoActual.id, asistenteId);
        const i = asistentesTodos.findIndex((a) => a.id === asistenteId);
        if (i !== -1) asistentesTodos[i] = { ...asistentesTodos[i], ...actualizado };
        pintarMetricas(asistentesTodos, totalRegistrados, eventoActual);
        renderizarTabla(filtrar(asistentesTodos, buscador.value));
      } catch (error) {
        botonLlegada.disabled = false;
        window.alert(error.message || 'No se pudo actualizar el check-in.');
      }
      return;
    }

    const botonEliminar = evento.target.closest('.boton-eliminar');
    if (botonEliminar) {
      asistenteAEliminar = {
        id: botonEliminar.dataset.asistenteId,
        nombre: botonEliminar.dataset.asistenteNombre,
      };
      dialogoEliminarNombre.textContent = asistenteAEliminar.nombre;
      dialogoEliminar.showModal();
    }
  });

  // Confirmacion antes de borrar: un click de mas en una tabla larga no
  // debe poder eliminar a alguien por accidente.
  let asistenteAEliminar = null;

  botonCancelarEliminar.addEventListener('click', () => {
    asistenteAEliminar = null;
    dialogoEliminar.close();
  });

  dialogoEliminar.addEventListener('cancel', () => {
    asistenteAEliminar = null;
  });

  botonConfirmarEliminar.addEventListener('click', async () => {
    if (!asistenteAEliminar || !eventoActual) return;
    const { id, nombre } = asistenteAEliminar;
    botonConfirmarEliminar.disabled = true;
    try {
      await Api.eliminarAsistente(eventoActual.id, id);
      const eliminado = asistentesTodos.find((a) => a.id === id);
      asistentesTodos = asistentesTodos.filter((a) => a.id !== id);
      // El total que pinta la tarjeta solo cuenta REGISTRADO, igual que
      // el backend: si el que se borro estaba cancelado, no debe restar.
      if (eliminado && eliminado.estado === 'REGISTRADO') {
        totalRegistrados = Math.max(0, totalRegistrados - 1);
      }
      pintarMetricas(asistentesTodos, totalRegistrados, eventoActual);
      renderizarTabla(filtrar(asistentesTodos, buscador.value));
      asistenteAEliminar = null;
      dialogoEliminar.close();
    } catch (error) {
      window.alert(error.message || `No se pudo eliminar a ${nombre}.`);
    } finally {
      botonConfirmarEliminar.disabled = false;
    }
  });

  // Exporta exactamente lo que esta visible (respeta el filtro del
  // buscador): sirve tanto para "toda la lista" como para "solo estas
  // 5 personas que busque".
  function exportarCsv() {
    const columnas = ['Código', 'Nombre', 'Correo', 'Teléfono', 'Estado', 'Registrado', 'Llegada'];
    const filas = asistentesVisibles.map((a) => [
      a.codigo || '',
      a.nombre,
      a.correo,
      a.telefono,
      a.estado,
      a.createdAt ? new Date(a.createdAt).toISOString() : '',
      a.llegadaEn ? new Date(a.llegadaEn).toISOString() : '',
    ]);

    const escaparCelda = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    // BOM al inicio: sin el, Excel en Windows interpreta los acentos y la
    // ñ como caracteres sueltos en vez de UTF-8.
    const csv = '﻿' + [columnas, ...filas]
      .map((fila) => fila.map(escaparCelda).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    enlace.href = url;
    enlace.download = `asistentes-a-todo-terreno-${fecha}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  botonExportarCsv.addEventListener('click', exportarCsv);

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
      await cargarAsistentes(eventoActual.id, eventoActual);
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
