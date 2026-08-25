// Validación en el navegador, espejo exacto de lo que valida el backend
// (backend/src/asistentes/dto/create-asistente.dto.ts).
//
// Por qué existe: sin esto, un correo mal escrito no aparece hasta el
// paso 3, al pulsar "Sellar mi lugar" — dos pasos después de donde estaba
// el error y sin saber cuál de los campos falla. Estas reglas muestran el
// problema junto al campo, en el momento.
//
// IMPORTANTE: si cambian las reglas del backend, hay que cambiarlas aquí
// también. Si las dos versiones se separan, el formulario rechazaría
// datos que el servidor acepta, o dejaría pasar datos que el servidor va
// a rechazar igual.

// Las reglas por campo. El mensaje es el que ve la persona, así que dice
// qué hacer, no qué falló.
const REGLAS = {
  nombre: (v) => {
    if (!v) return 'Necesitamos tu nombre para el pasaporte.';
    if (v.length < 3) return 'Escribe tu nombre completo.';
    if (v.length > 150) return 'Ese nombre es demasiado largo.';
    return '';
  },
  telefono: (v) => {
    if (!v) return 'Necesitamos un teléfono de contacto.';
    if (!/^\+?\d{7,15}$/.test(v)) return 'Escribe el número sin espacios ni guiones.';
    return '';
  },
  email: (v) => {
    if (!v) return 'Necesitamos tu correo para avisarte del viaje.';
    // Deliberadamente permisiva: la validación real la hace el servidor y,
    // en última instancia, que el correo llegue. Rechazar direcciones
    // raras pero legítimas es peor que dejar pasar una con errata.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Revisa el correo, parece incompleto.';
    return '';
  },
};

/** Devuelve el mensaje de error de un campo, o '' si está bien. */
export function errorDeCampo(nombre, valor) {
  const regla = REGLAS[nombre];
  return regla ? regla((valor || '').trim()) : '';
}

/** Pinta (o limpia) el error de un campo. Devuelve si el campo es válido. */
export function pintarCampo(input) {
  if (!input) return true;
  const mensaje = errorDeCampo(input.name, input.value);
  const errorEl = document.getElementById(`err-${input.name}`);

  input.classList.toggle('invalid', Boolean(mensaje));
  input.classList.toggle('is-ok', !mensaje && input.value.trim() !== '');
  input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  if (errorEl) errorEl.textContent = mensaje;

  return !mensaje;
}

/**
 * Engancha la validación a un formulario.
 *
 * Se valida al salir del campo, no mientras se escribe: marcar en rojo
 * un correo "incompleto" mientras la persona todavía lo está tecleando
 * es hostil. Una vez que el campo ya está marcado como inválido, sí se
 * revalida en cada tecla, para que el error desaparezca en cuanto se
 * corrige en vez de esperar a que vuelva a salir del campo.
 */
export function initValidacion(form) {
  const campos = ['nombre', 'telefono', 'email']
    .map((n) => form.elements[n])
    .filter(Boolean);

  campos.forEach((input) => {
    input.addEventListener('blur', () => pintarCampo(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) pintarCampo(input);
    });
  });

  return {
    /** Valida todo el formulario y enfoca el primer campo con problema. */
    validarTodo() {
      let primerFallo = null;
      campos.forEach((input) => {
        if (!pintarCampo(input) && !primerFallo) primerFallo = input;
      });
      if (primerFallo) primerFallo.focus();
      return !primerFallo;
    },
  };
}
