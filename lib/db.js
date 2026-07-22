import { sql } from '@vercel/postgres';

export { sql };

// Los códigos se comparan siempre normalizados para que no importe si la
// persona los escribe en minúscula o con espacios de más.
export function normalizarCodigo(codigo) {
  return String(codigo || '').trim().toUpperCase();
}
