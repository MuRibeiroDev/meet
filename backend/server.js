import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import authRoutes from './routes/auth.js';
import salasRoutes from './routes/salas.js';
import agendamentosRoutes from './routes/agendamentos.js';
import usuariosRoutes from './routes/usuarios.js';
import salaDisplayRoutes from './routes/sala.js';
import passwordRoutes from './routes/password.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// Compressão gzip para melhor performance
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sala', salaDisplayRoutes);
app.use('/api/password', passwordRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API de Agendamento de Reuniões funcionando',
    timestamp: new Date().toISOString()
  });
});

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Sincronizar banco de dados e iniciar servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    
    // Sincronizar modelos (não usar force: true em produção!)
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados com o banco de dados');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 API disponível em: http://localhost:${PORT}/api`);
      console.log(`🌐 Acesso na rede: http://10.1.1.30:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
