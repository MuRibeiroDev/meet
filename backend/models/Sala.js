import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Sala = sequelize.define('Sala', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  capacidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  ativa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'salas',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

export default Sala;
