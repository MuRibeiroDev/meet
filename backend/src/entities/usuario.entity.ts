import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { Agendamento } from './agendamento.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'senha_hash' })
  @Exclude()
  senha_hash: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criado_em: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizado_em: Date;

  @OneToMany(() => Agendamento, (agendamento) => agendamento.usuario)
  agendamentos: Agendamento[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.senha_hash && !this.senha_hash.startsWith('$2')) {
      this.senha_hash = await bcrypt.hash(this.senha_hash, 8);
    }
  }

  async verificarSenha(senha: string): Promise<boolean> {
    return await bcrypt.compare(senha, this.senha_hash);
  }
}
