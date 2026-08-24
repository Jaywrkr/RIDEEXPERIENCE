// Mecánica de pistas de ruta: cada pista se desbloquea sola al cruzar un umbral
// de días restantes hacia el evento. No hay acción del usuario que las abra:
// el terreno (el tiempo) decide, reforzando la narrativa de "tres pistas, cero respuestas".
const CLUES = [
  {
    umbralDias: 10, // se abre 15 de septiembre
    texto: 'LA PISTA DE MALETAS · Prepara la maleta: repelente, bloqueador, ropa ligera, chanclas cómodas. Y lo más importante: no olvides tu pasaporte físico.',
  },
  {
    umbralDias: 5,
    texto: 'Va a haber fuego en la arena, y no es solo para calentarse. Lleva algo que quieras dejar atrás.',
  },
  {
    umbralDias: 1,
    texto: 'El bus llega a destino mañana. Ahí, por fin, se rompe el misterio.',
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
