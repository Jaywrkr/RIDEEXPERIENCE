import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Algoritmo oficial (modulo 10) de validacion de cedula ecuatoriana:
 * https://www.registrocivil.gob.ec — valida provincia, tercer digito y
 * digito verificador. No solo revisa el formato de 10 digitos.
 */
export function esCedulaEcuatorianaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula[9], 10);

  const suma = coeficientes.reduce((acc, coef, i) => {
    let valor = parseInt(cedula[i], 10) * coef;
    if (valor >= 10) valor -= 9;
    return acc + valor;
  }, 0);

  const modulo = suma % 10;
  const digitoCalculado = modulo === 0 ? 0 : 10 - modulo;

  return digitoCalculado === digitoVerificador;
}

@ValidatorConstraint({ name: 'esCedulaEcuatoriana', async: false })
class EsCedulaEcuatorianaConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && esCedulaEcuatorianaValida(value);
  }

  defaultMessage(): string {
    return 'La cedula ingresada no es valida.';
  }
}

export function EsCedulaEcuatoriana(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: EsCedulaEcuatorianaConstraint,
    });
  };
}
