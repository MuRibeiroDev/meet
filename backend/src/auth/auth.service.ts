import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../entities/usuario.entity';
import { RegisterDto, LoginDto, AtualizarSenhaTemporarioDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  private formatarNome(nome: string): string {
    const preposicoes = ['de', 'da', 'do', 'dos', 'das', 'e'];
    return nome
      .trim()
      .split(' ')
      .map((palavra, index) => {
        const palavraLower = palavra.toLowerCase();
        if (index === 0 || !preposicoes.includes(palavraLower)) {
          return palavraLower.charAt(0).toUpperCase() + palavraLower.slice(1);
        }
        return palavraLower;
      })
      .join(' ');
  }

  async register(registerDto: RegisterDto) {
    const { nome, email, senha } = registerDto;

    // Verificar se usuário já existe
    const usuarioExistente = await this.usuariosRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (usuarioExistente) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Criar usuário
    const usuario = this.usuariosRepository.create({
      nome: this.formatarNome(nome),
      email: email.toLowerCase(),
      senha_hash: senha, // Será criptografada pelo hook BeforeInsert
    });

    await this.usuariosRepository.save(usuario);

    // Gerar token
    const token = this.jwtService.sign({
      id: usuario.id,
      email: usuario.email,
    });

    return {
      message: 'Usuário criado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;
    console.log('[LOGIN] Tentativa de login:', email);

    // Buscar usuário
    const usuario = await this.usuariosRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'nome', 'email', 'senha_hash', 'ativo'],
    });

    if (!usuario) {
      console.log('[LOGIN] Usuário não encontrado:', email);
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!usuario.ativo) {
      console.log('[LOGIN] Usuário inativo:', email);
      throw new UnauthorizedException('Usuário inativo');
    }

    console.log('[LOGIN] Verificando senha...');
    const startTime = Date.now();

    // Verificar senha
    const senhaValida = await usuario.verificarSenha(senha);

    const timeElapsed = Date.now() - startTime;
    console.log(`[LOGIN] Verificação de senha levou ${timeElapsed}ms`);

    if (!senhaValida) {
      console.log('[LOGIN] Senha inválida para:', email);
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    console.log('[LOGIN] Gerando token...');

    // Gerar token
    const token = this.jwtService.sign({
      id: usuario.id,
      email: usuario.email,
    });

    console.log('[LOGIN] Login bem-sucedido para:', email);

    return {
      message: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    };
  }

  async atualizarSenhaTemporario(dto: AtualizarSenhaTemporarioDto) {
    const { email, senha_nova } = dto;

    // Buscar usuário
    const usuario = await this.usuariosRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Atualizar senha diretamente
    const senhaHash = await bcrypt.hash(senha_nova, 8);

    await this.dataSource.query(
      'UPDATE usuarios SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
      [senhaHash, usuario.id],
    );

    console.log(`✅ Senha atualizada para: ${email}`);

    return {
      message: 'Senha atualizada com sucesso! Agora você pode fazer login normalmente.',
      email: usuario.email,
    };
  }
}
