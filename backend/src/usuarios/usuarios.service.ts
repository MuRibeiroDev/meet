import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async findAll() {
    return await this.usuariosRepository.find({
      where: { ativo: true },
      select: ['id', 'nome', 'email', 'criado_em'],
      order: { nome: 'ASC' },
    });
  }
}
