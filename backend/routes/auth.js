import express from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validações
const validacaoRegistro = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

const validacaoLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
];

// Função para formatar nome
const formatarNome = (nome) => {
  const preposicoes = ['de', 'da', 'do', 'dos', 'das', 'e'];
  return nome.trim().split(' ').map((palavra, index) => {
    const palavraLower = palavra.toLowerCase();
    if (index === 0 || !preposicoes.includes(palavraLower)) {
      return palavraLower.charAt(0).toUpperCase() + palavraLower.slice(1);
    }
    return palavraLower;
  }).join(' ');
};

// POST /api/auth/register - Registrar novo usuário
router.post('/register', validacaoRegistro, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha } = req.body;

    // Verificar se usuário já existe
    const usuarioExistente = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar usuário
    const usuario = await Usuario.create({
      nome: formatarNome(nome),
      email: email.toLowerCase(),
      senha_hash: senha // Será criptografada pelo hook
    });

    // Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
});

// POST /api/auth/login - Login
router.post('/login', validacaoLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, senha } = req.body;

    // Buscar usuário
    const usuario = await Usuario.findOne({ 
      where: { email: email.toLowerCase() },
      attributes: ['id', 'nome', 'email', 'senha_hash', 'ativo']
    });
    
    if (!usuario) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Verificar senha
    const senhaValida = await usuario.verificarSenha(senha);
    
    if (!senhaValida) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// POST /api/auth/atualizar-senha-temporario - ROTA TEMPORÁRIA para migração de senhas
router.post('/atualizar-senha-temporario', async (req, res) => {
  try {
    const { email, senha_nova } = req.body;

    if (!email || !senha_nova) {
      return res.status(400).json({ message: 'Email e senha_nova são obrigatórios' });
    }

    // Buscar usuário
    const usuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Atualizar senha diretamente usando bcrypt
    const bcryptLib = await import('bcryptjs');
    const senhaHash = await bcryptLib.default.hash(senha_nova, 8);
    
    // Atualizar no banco sem trigger de hook
    await usuario.sequelize.query(
      'UPDATE usuarios SET senha_hash = :senha_hash, atualizado_em = NOW() WHERE id = :id',
      {
        replacements: { senha_hash: senhaHash, id: usuario.id }
      }
    );

    console.log(`✅ Senha atualizada para: ${email}`);

    res.json({ 
      message: 'Senha atualizada com sucesso! Agora você pode fazer login normalmente.',
      email: usuario.email
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro ao atualizar senha', error: error.message });
  }
});

export default router;
