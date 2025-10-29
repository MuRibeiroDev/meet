import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrarSenhas() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Buscar todos os usuários
    const result = await client.query('SELECT id, email, senha_hash FROM usuarios');
    console.log(`Encontrados ${result.rows.length} usuários`);

    for (const usuario of result.rows) {
      // Verificar se a senha já está em formato bcrypt
      if (usuario.senha_hash.startsWith('$2a$') || usuario.senha_hash.startsWith('$2b$')) {
        console.log(`Usuário ${usuario.email} já tem senha em bcrypt, pulando...`);
        continue;
      }

      // Senhas do Flask/Werkzeug começam com pbkdf2:sha256 ou scrypt:
      console.log(`\n⚠️  Usuário: ${usuario.email}`);
      console.log(`Hash atual (Werkzeug/Flask): ${usuario.senha_hash.substring(0, 50)}...`);
      console.log('\nPara este usuário, você precisa:');
      console.log('1. Redefinir a senha manualmente no banco, ou');
      console.log('2. Usar a funcionalidade "Esqueci minha senha" (quando implementada), ou');
      console.log('3. Criar um novo cadastro');
      console.log('\nOu, se você sabe a senha em texto plano, podemos atualizar agora.');
      console.log('Execute: node scripts/atualizar-senha.js');
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📝 SOLUÇÃO RÁPIDA: Crie uma rota temporária para atualizar senhas ou use o cadastro.');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

migrarSenhas();
