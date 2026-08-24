import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @Length(3, 150)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @Length(3, 200)
  lugar: string;

  @Type(() => Date)
  @IsDate({ message: 'fechaInicio debe ser una fecha valida (ISO 8601).' })
  fechaInicio: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'fechaFin debe ser una fecha valida (ISO 8601).' })
  fechaFin?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'fechaAvisoPrevio debe ser una fecha valida (ISO 8601).' })
  fechaAvisoPrevio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'fechaAvisoFinal debe ser una fecha valida (ISO 8601).' })
  fechaAvisoFinal?: Date;
}
