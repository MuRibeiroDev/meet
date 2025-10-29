import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Sala from './Sala.js';
import Usuario from './Usuario.js';

const Agendamento = sequelize.define('Agendamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sala_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'salas',
      key: 'id'
    },
    field: 'sala_id'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'usuario_id'
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_inicio'
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_fim'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'confirmado',
    validate: {
      isIn: [['confirmado', 'cancelado', 'concluido']]
    }
  },
  participantes: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  link_reuniao: {
    type: DataTypes.TEXT,
    field: 'link_reuniao'
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  criado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'criado_em'
  },
  atualizado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'atualizado_em'
  }
}, {
  tableName: 'agendamentos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

// Relacionamentos
Agendamento.belongsTo(Sala, { foreignKey: 'sala_id', as: 'sala' });
Agendamento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Sala.hasMany(Agendamento, { foreignKey: 'sala_id', as: 'agendamentos' });
Usuario.hasMany(Agendamento, { foreignKey: 'usuario_id', as: 'agendamentos' });

export default Agendamento;
