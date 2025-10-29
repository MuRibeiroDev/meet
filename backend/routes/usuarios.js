import express from 'express';
import Usuario from '../models/Usuario.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/usuarios/me - Buscar usuário logado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json(req.usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// GET /api/usuarios - Listar usuários (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { ativo: true },
      attributes: ['id', 'nome', 'email', 'criado_em'],
      order: [['nome', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

export default router;
