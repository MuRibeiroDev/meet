import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Buscar token no header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
    }

    // Adicionar usuário ao request
    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(500).json({ message: 'Erro ao validar token' });
  }
};
