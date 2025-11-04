import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordController } from './password.controller';
import { PasswordService } from './password.service';
import { Usuario } from '../entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [PasswordController],
  providers: [PasswordService],
})
export class PasswordModule {}
