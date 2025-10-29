import pkg from 'pg';
const { Pool } = pkg;

// Conexão com o banco de chamados
const chamadosPool = new Pool({
  host: '209.126.8.14',
  port: 5432,
  database: 'chamados',
  user: 'root',
  password: 'zXZzR79pzJ1x032uE'
});

export const criarChamadoTI = async (agendamento, usuario, sala) => {
  try {
    // Formatar data e hora
    const dataInicio = new Date(agendamento.data_inicio);
    const dataFim = new Date(agendamento.data_fim);
    
    const formatarData = (data) => {
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const formatarHora = (data) => {
      return data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };
    
    // Dia da semana
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaSemana = diasSemana[dataInicio.getDay()];
    
    // Montar descrição do chamado
    let descricao = `Responsável: ${usuario.nome}\n`;
    descricao += `Sala: ${sala ? sala.nome : 'Não informada'}\n`;
    descricao += `Data e Hora: ${diaSemana}, ${formatarData(dataInicio)} até ${formatarHora(dataFim)}`;
    
    if (agendamento.link_reuniao) {
      descricao += `\nLink: ${agendamento.link_reuniao}`;
    }
    
    // Inserir chamado no banco
    const query = `
      INSERT INTO chamado (
        telefone, categoria_id, empresa_id, unidade_id, 
        departamento, descricao, status, user_profile_id, criado_em, atualizado_em
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING id
    `;
    
    const values = [
      '',                    // telefone vazio
      1,                     // categoria_id: Infraestrutura
      1,                     // empresa_id: Transzilli
      10,                    // unidade_id: BR-153
      'Sala Reunião',        // departamento
      descricao,             // descricao
      0,                     // status: aberto
      259                    // user_profile_id: usuário sala de reunião
    ];
    
    const result = await chamadosPool.query(query, values);
    const ticketId = result.rows[0].id;
    
    console.log('Chamado TI criado com sucesso. ID:', ticketId);
    return ticketId;
    
  } catch (error) {
    console.error('Erro ao criar chamado TI:', error);
    return null;
  }
};
