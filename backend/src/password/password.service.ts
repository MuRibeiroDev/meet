import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto } from './dto/password.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

interface ResetCodeData {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class PasswordService {
  private resetCodes: Map<string, ResetCodeData> = new Map();

  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private dataSource: DataSource,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    console.log('📧 [FORGOT] Verificando usuário:', email);
    const usuario = await this.usuariosRepository.findOne({ where: { email } });

    if (!usuario) {
      console.log('❌ [FORGOT] Usuário não encontrado:', email);
      throw new NotFoundException('Email não encontrado');
    }

    console.log('✅ [FORGOT] Usuário encontrado:', usuario.nome);

    // Gerar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    console.log('🔑 [FORGOT] Código gerado:', code);

    // Armazenar código com expiração de 15 minutos
    this.resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
    });
    console.log('💾 [FORGOT] Código armazenado em memória');

    // TODO: Integrar com EmailService para enviar o código
    console.log(`📨 [FORGOT] Código para ${email}: ${code}`);

    return { message: 'Código enviado para seu email' };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const { email, code } = dto;
    console.log('🔍 [VERIFY] Verificando código para:', email);
    console.log('🔍 [VERIFY] Código recebido:', code);

    const resetData = this.resetCodes.get(email);

    if (!resetData) {
      console.log('❌ [VERIFY] Código não encontrado para:', email);
      throw new BadRequestException('Código inválido ou expirado');
    }

    console.log('💾 [VERIFY] Código armazenado:', resetData.code);
    console.log('⏰ [VERIFY] Expira em:', new Date(resetData.expiresAt).toLocaleString());
    console.log('🔢 [VERIFY] Tentativas:', resetData.attempts);

    // Verificar expiração
    if (Date.now() > resetData.expiresAt) {
      console.log('⏰ [VERIFY] Código expirado!');
      this.resetCodes.delete(email);
      throw new BadRequestException('Código expirado. Solicite um novo código');
    }

    // Verificar tentativas
    if (resetData.attempts >= 3) {
      console.log('❌ [VERIFY] Número máximo de tentativas excedido!');
      this.resetCodes.delete(email);
      throw new BadRequestException(
        'Número máximo de tentativas excedido. Solicite um novo código',
      );
    }

    // Verificar código
    if (resetData.code !== code) {
      resetData.attempts++;
      console.log('❌ [VERIFY] Código inválido! Tentativa:', resetData.attempts);
      throw new BadRequestException('Código inválido');
    }

    console.log('✅ [VERIFY] Código válido!');
    return { message: 'Código válido', valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, newPassword } = dto;
    console.log('🔄 [RESET] Iniciando reset de senha para:', email);

    const resetData = this.resetCodes.get(email);
    console.log('💾 [RESET] Dados do código:', resetData ? 'Encontrado' : 'Não encontrado');

    if (!resetData) {
      console.log('❌ [RESET] Código não encontrado');
      throw new BadRequestException('Código inválido ou expirado');
    }

    // Verificar expiração
    if (Date.now() > resetData.expiresAt) {
      console.log('⏰ [RESET] Código expirado');
      this.resetCodes.delete(email);
      throw new BadRequestException('Código expirado. Solicite um novo código');
    }

    // Verificar código
    if (resetData.code !== code) {
      console.log('❌ [RESET] Código incorreto');
      throw new BadRequestException('Código inválido');
    }

    console.log('✅ [RESET] Código válido, buscando usuário...');

    // Buscar usuário
    const usuario = await this.usuariosRepository.findOne({ where: { email } });

    if (!usuario) {
      console.log('❌ [RESET] Usuário não encontrado');
      throw new NotFoundException('Usuário não encontrado');
    }

    console.log('✅ [RESET] Usuário encontrado:', usuario.nome);

    // Atualizar senha
    console.log('🔐 [RESET] Iniciando atualização de senha');
    console.log('🔐 [RESET] Nova senha recebida (length):', newPassword.length);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('🔐 [RESET] Hash gerado:', hashedPassword.substring(0, 20) + '...');

    // Atualizar direto no banco para evitar o beforeUpdate hook que faz hash duplo
    await this.dataSource.query(
      'UPDATE usuarios SET senha_hash = $1, atualizado_em = NOW() WHERE email = $2',
      [hashedPassword, email],
    );

    console.log(`✅ [RESET] Senha atualizada com sucesso para: ${email}`);

    // Remover código usado
    this.resetCodes.delete(email);

    return { message: 'Senha redefinida com sucesso' };
  }
}
