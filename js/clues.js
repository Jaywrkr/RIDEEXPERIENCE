// Mecánica de pistas de ruta: cada pista se desbloquea sola al cruzar un umbral
// de días restantes hacia el evento. No hay acción del usuario que las abra:
// el terreno (el tiempo) decide, reforzando la narrativa de expedición.
const CLUES = [
  {
    umbralDias: Infinity, // visible desde que el usuario queda sellado
    texto: 'Las Tanusas quedan a menos de dos horas de asfalto del último surtidor. Cargá el tanque antes de salir del pueblo.',
  },
  {
    umbralDias: 30,
    texto: 'El tramo de arena blanda empieza después del segundo cruce de agua. Bajá la presión de las cubiertas ahí, no antes.',
  },
  {
    umbralDias: 15,
    texto: 'El campamento base no tiene señal. El punto de encuentro se confirma 48 horas antes por este mismo canal.',
  },
  {
    umbralDias: 7,
    texto: 'Cabeza de expedición sale un día antes que el resto. Si tu categoría es Elite, tu briefing llega por separado.',
  },
  {
    umbralDias: 2,
    texto: 'Última pista: llevá el manifiesto sellado. En Las Tanusas, el que no está en la lista, no entra al convoy.',
  },
];

export function renderClues(diffMs) {
  const lista = document.getElementById('pistasLista');
  if (!lista) return;

  const diasRestantes = diffMs / 86400000;

  lista.innerHTML = '';
  CLUES.forEach((clue, i) => {
    const unlocked = diasRestantes <= clue.umbralDias;
    const li = document.createElement('li');
    li.className = `pista ${unlocked ? 'is-unlocked' : 'is-locked'}`;
    li.innerHTML = `
      <span class="pista__num">${String(i + 1).padStart(2, '0')}</span>
      <span class="pista__texto">${unlocked ? clue.texto : 'SELLADA — se abre más cerca de la fecha.'}</span>
    `;
    lista.appendChild(li);
  });
}
