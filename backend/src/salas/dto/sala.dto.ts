import { IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateSalaDto {
  @IsNotEmpty({ message: 'Nome da sala é obrigatório' })
  nome: string;

  @IsOptional()
  @IsInt()
  capacidade?: number;
}

export class UpdateSalaDto {
  @IsOptional()
  nome?: string;

  @IsOptional()
  @IsInt()
  capacidade?: number;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
