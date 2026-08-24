import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electronico no es valido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  password: string;
}
