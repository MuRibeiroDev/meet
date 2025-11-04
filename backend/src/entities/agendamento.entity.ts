import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sala } from './sala.entity';
import { Usuario } from './usuario.entity';

@Entity('agendamentos')
export class Agendamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'sala_id' })
  sala_id: number;

  @Column({ type: 'integer', name: 'usuario_id' })
  usuario_id: number;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'timestamp without time zone', name: 'data_inicio' })
  data_inicio: string;

  @Column({ type: 'timestamp without time zone', name: 'data_fim' })
  data_fim: string;

  @Column({ type: 'varchar', length: 20, default: 'confirmado' })
  status: string;

  @Column({ type: 'integer', default: 1 })
  participantes: number;

  @Column({ type: 'text', nullable: true, name: 'link_reuniao' })
  link_reuniao: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ name: 'criado_em' })
  criado_em: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizado_em: Date;

  @ManyToOne(() => Sala, (sala) => sala.agendamentos, { eager: true })
  @JoinColumn({ name: 'sala_id' })
  sala: Sala;

  @ManyToOne(() => Usuario, (usuario) => usuario.agendamentos, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
