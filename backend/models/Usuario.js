import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'senha_hash'
  },
  ativo: {
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
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha_hash) {
        // Reduzido de 10 para 8 rounds para melhor performance
        usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, 8);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha_hash')) {
        // Reduzido de 10 para 8 rounds para melhor performance
        usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, 8);
      }
    }
  }
});

// Método para verificar senha
Usuario.prototype.verificarSenha = async function(senha) {
  return await bcrypt.compare(senha, this.senha_hash);
};

// Método para retornar dados seguros (sem senha)
Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.senha_hash;
  return values;
};

export default Usuario;
