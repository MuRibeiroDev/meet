import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Usuario from '../models/Usuario.js';
import { emailService } from '../services/email.service.js';
import { sequelize } from '../config/database.js';

const router = express.Router();

// Armazenamento temporário de códigos (em produção, use Redis ou banco)
const resetCodes = new Map();

// POST /api/password/forgot - Solicitar código de recuperação
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Verificar se usuário existe
    console.log('📧 [FORGOT] Verificando usuário:', email);
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario) {
      console.log('❌ [FORGOT] Usuário não encontrado:', email);
      return res.status(404).json({ message: 'Email não encontrado' });
    }

    console.log('✅ [FORGOT] Usuário encontrado:', usuario.nome);

    // Gerar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    console.log('🔑 [FORGOT] Código gerado:', code);
    
    // Armazenar código com expiração de 15 minutos
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutos
      attempts: 0
    });
    console.log('💾 [FORGOT] Código armazenado em memória');

    // Enviar email com o código de forma assíncrona (não bloqueante)
    if (emailService.isConfigured()) {
      // Enviar email em background sem bloquear a resposta
      emailService.sendPasswordResetCode(email, usuario.nome, code)
        .then(() => {
          console.log(`📨 [FORGOT] Email enviado com código: ${code}`);
        })
        .catch((error) => {
          console.error('❌ [FORGOT] Erro ao enviar email:', error);
        });
      
      // Responder imediatamente sem esperar o email
      console.log('⚡ [FORGOT] Respondendo imediatamente (email em background)');
    } else {
      console.log(`⚠️ [FORGOT] Serviço de email não configurado. Código: ${code}`);
      return res.status(500).json({ message: 'Serviço de email não configurado' });
    }

    res.json({ message: 'Código enviado para seu email' });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro ao solicitar recuperação de senha' });
  }
});

// POST /api/password/verify-code - Verificar código de recuperação
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('🔍 [VERIFY] Verificando código para:', email);
    console.log('🔍 [VERIFY] Código recebido:', code);

    if (!email || !code) {
      return res.status(400).json({ message: 'Email e código são obrigatórios' });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      console.log('❌ [VERIFY] Código não encontrado para:', email);
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    console.log('💾 [VERIFY] Código armazenado:', resetData.code);
    console.log('⏰ [VERIFY] Expira em:', new Date(resetData.expiresAt).toLocaleString());
    console.log('🔢 [VERIFY] Tentativas:', resetData.attempts);

    // Verificar expiração
    if (Date.now() > resetData.expiresAt) {
      console.log('⏰ [VERIFY] Código expirado!');
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Código expirado. Solicite um novo código' });
    }

    // Verificar tentativas
    if (resetData.attempts >= 3) {
      console.log('❌ [VERIFY] Número máximo de tentativas excedido!');
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Número máximo de tentativas excedido. Solicite um novo código' });
    }

    // Verificar código
    if (resetData.code !== code) {
      resetData.attempts++;
      console.log('❌ [VERIFY] Código inválido! Tentativa:', resetData.attempts);
      return res.status(400).json({ message: 'Código inválido' });
    }

    console.log('✅ [VERIFY] Código válido!');
    res.json({ message: 'Código válido', valid: true });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ message: 'Erro ao verificar código' });
  }
});

// POST /api/password/reset - Redefinir senha
router.post('/reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    console.log('🔄 [RESET] Iniciando reset de senha para:', email);

    if (!email || !code || !newPassword) {
      console.log('❌ [RESET] Dados incompletos');
      return res.status(400).json({ message: 'Email, código e nova senha são obrigatórios' });
    }

    // Validar senha
    if (newPassword.length < 6) {
      console.log('❌ [RESET] Senha muito curta');
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const resetData = resetCodes.get(email);
    console.log('💾 [RESET] Dados do código:', resetData ? 'Encontrado' : 'Não encontrado');

    if (!resetData) {
      console.log('❌ [RESET] Código não encontrado');
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    // Verificar expiração
    if (Date.now() > resetData.expiresAt) {
      console.log('⏰ [RESET] Código expirado');
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Código expirado. Solicite um novo código' });
    }

    // Verificar código
    if (resetData.code !== code) {
      console.log('❌ [RESET] Código incorreto');
      return res.status(400).json({ message: 'Código inválido' });
    }

    console.log('✅ [RESET] Código válido, buscando usuário...');

    // Buscar usuário
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario) {
      console.log('❌ [RESET] Usuário não encontrado');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('✅ [RESET] Usuário encontrado:', usuario.nome);

    // Atualizar senha
    console.log('🔐 [RESET] Iniciando atualização de senha');
    console.log('🔐 [RESET] Nova senha recebida (length):', newPassword.length);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('🔐 [RESET] Hash gerado:', hashedPassword.substring(0, 20) + '...');
    
    // Atualizar direto no banco para evitar o beforeUpdate hook que faz hash duplo
    await sequelize.query(
      'UPDATE usuarios SET senha_hash = :senha_hash, atualizado_em = NOW() WHERE email = :email',
      {
        replacements: { senha_hash: hashedPassword, email },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log(`✅ [RESET] Senha atualizada com sucesso para: ${email}`);

    // Remover código usado
    resetCodes.delete(email);

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
});

export default router;
