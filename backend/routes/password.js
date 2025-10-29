import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Usuario from '../models/Usuario.js';
import { emailService } from '../services/email.service.js';

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
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario) {
      // Por segurança, não informar se o email existe ou não
      return res.json({ message: 'Se o email existir, você receberá um código de recuperação' });
    }

    // Gerar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Armazenar código com expiração de 15 minutos
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutos
      attempts: 0
    });

    // Enviar email com o código
    if (emailService.isConfigured()) {
      try {
        await emailService.sendPasswordResetCode(email, usuario.nome, code);
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        return res.status(500).json({ message: 'Erro ao enviar email de recuperação' });
      }
    } else {
      console.log(`Código de recuperação para ${email}: ${code}`);
      return res.status(500).json({ message: 'Serviço de email não configurado' });
    }

    res.json({ message: 'Código de recuperação enviado para o email' });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro ao solicitar recuperação de senha' });
  }
});

// POST /api/password/verify-code - Verificar código de recuperação
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email e código são obrigatórios' });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    // Verificar expiração
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Código expirado. Solicite um novo código' });
    }

    // Verificar tentativas
    if (resetData.attempts >= 3) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Número máximo de tentativas excedido. Solicite um novo código' });
    }

    // Verificar código
    if (resetData.code !== code) {
      resetData.attempts++;
      return res.status(400).json({ message: 'Código inválido' });
    }

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

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, código e nova senha são obrigatórios' });
    }

    // Validar senha
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    // Verificar expiração
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Código expirado. Solicite um novo código' });
    }

    // Verificar código
    if (resetData.code !== code) {
      return res.status(400).json({ message: 'Código inválido' });
    }

    // Buscar usuário
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usuario.update({ senha: hashedPassword });

    // Remover código usado
    resetCodes.delete(email);

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
});

export default router;
