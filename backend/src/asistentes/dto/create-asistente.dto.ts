import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateAsistenteDto {
  @IsString()
  @Length(3, 150)
  nombre: string;

  @IsEmail({}, { message: 'El correo electronico no es valido.' })
  correo: string;

  @IsString()
  @Matches(/^\+?\d{7,15}$/, {
    message: 'El telefono debe tener entre 7 y 15 digitos, puede incluir + al inicio.',
  })
  telefono: string;
}
