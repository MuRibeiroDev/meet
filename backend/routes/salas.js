import express from 'express';
import Sala from '../models/Sala.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/salas - Listar todas as salas ativas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const salas = await Sala.findAll({
      where: { ativa: true },
      order: [['nome', 'ASC']]
    });
    res.json(salas);
  } catch (error) {
    console.error('Erro ao buscar salas:', error);
    res.status(500).json({ message: 'Erro ao buscar salas' });
  }
});

// GET /api/salas/:id - Buscar sala por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sala = await Sala.findByPk(req.params.id);
    
    if (!sala) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    res.json(sala);
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    res.status(500).json({ message: 'Erro ao buscar sala' });
  }
});

// POST /api/salas - Criar nova sala
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, capacidade } = req.body;
    
    if (!nome) {
      return res.status(400).json({ message: 'Nome da sala é obrigatório' });
    }
    
    const sala = await Sala.create({
      nome,
      capacidade: capacidade || 10
    });
    
    res.status(201).json(sala);
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    res.status(500).json({ message: 'Erro ao criar sala' });
  }
});

// PUT /api/salas/:id - Atualizar sala
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const sala = await Sala.findByPk(req.params.id);
    
    if (!sala) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    const { nome, capacidade, ativa } = req.body;
    
    await sala.update({
      ...(nome && { nome }),
      ...(capacidade && { capacidade }),
      ...(ativa !== undefined && { ativa })
    });
    
    res.json(sala);
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    res.status(500).json({ message: 'Erro ao atualizar sala' });
  }
});

// DELETE /api/salas/:id - Desativar sala
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sala = await Sala.findByPk(req.params.id);
    
    if (!sala) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    await sala.update({ ativa: false });
    
    res.json({ message: 'Sala desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar sala:', error);
    res.status(500).json({ message: 'Erro ao desativar sala' });
  }
});

export default router;
