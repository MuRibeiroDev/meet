import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sala } from '../entities/sala.entity';
import { CreateSalaDto, UpdateSalaDto } from './dto/sala.dto';

@Injectable()
export class SalasService {
  constructor(
    @InjectRepository(Sala)
    private salasRepository: Repository<Sala>,
  ) {}

  async findAll() {
    return await this.salasRepository.find({
      where: { ativa: true },
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: number) {
    const sala = await this.salasRepository.findOne({ where: { id } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada');
    }
    return sala;
  }

  async create(createSalaDto: CreateSalaDto) {
    const sala = this.salasRepository.create({
      ...createSalaDto,
      capacidade: createSalaDto.capacidade || 10,
    });
    return await this.salasRepository.save(sala);
  }

  async update(id: number, updateSalaDto: UpdateSalaDto) {
    const sala = await this.findOne(id);
    Object.assign(sala, updateSalaDto);
    return await this.salasRepository.save(sala);
  }

  async remove(id: number) {
    const sala = await this.findOne(id);
    sala.ativa = false;
    await this.salasRepository.save(sala);
    return { message: 'Sala desativada com sucesso' };
  }
}
