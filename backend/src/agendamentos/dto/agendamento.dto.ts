import { IsInt, IsNotEmpty, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class CreateAgendamentoDto {
  @IsInt()
  @IsNotEmpty({ message: 'ID da sala é obrigatório' })
  sala_id: number;

  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsISO8601({}, { message: 'Data de início inválida' })
  data_inicio: string;

  @IsISO8601({}, { message: 'Data de fim inválida' })
  data_fim: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Número de participantes inválido' })
  participantes?: number;

  @IsOptional()
  @IsString()
  link_reuniao?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateAgendamentoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsISO8601()
  data_inicio?: string;

  @IsOptional()
  @IsISO8601()
  data_fim?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  participantes?: number;

  @IsOptional()
  @IsString()
  link_reuniao?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
