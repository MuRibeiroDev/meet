import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.smtpServer = process.env.SMTP_SERVER || 'smtp.gmail.com';
    this.smtpPort = parseInt(process.env.SMTP_PORT || '587');
    this.emailUser = process.env.EMAIL_USER;
    this.emailPassword = process.env.EMAIL_PASSWORD;
    this.fromName = process.env.EMAIL_FROM_NAME || 'Sistema de Reuniões';
    
    // Lista de emails para notificar sempre
    const notificationEmails = process.env.NOTIFICATION_EMAILS || '';
    this.notificationEmails = notificationEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  _createTransporter() {
    try {
      return nodemailer.createTransport({
        host: this.smtpServer,
        port: this.smtpPort,
        secure: false, // true para 465, false para outras portas
        auth: {
          user: this.emailUser,
          pass: this.emailPassword
        }
      });
    } catch (error) {
      console.error('Erro ao criar transporter SMTP:', error);
      return null;
    }
  }

  _formatDateTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      return dateString;
    }
  }

  async sendNewMeetingNotification(meetingData, recipientEmail, recipientName) {
    if (!this.emailUser || !this.emailPassword) {
      console.log('Serviço de email não configurado');
      return false;
    }

    try {
      const transporter = this._createTransporter();
      if (!transporter) {
        return false;
      }

      const dataInicio = this._formatDateTime(meetingData.data_inicio);
      const dataFim = this._formatDateTime(meetingData.data_fim);

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #374151; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                .footer { background-color: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #374151; }
                .meeting-details { margin: 15px 0; }
                .meeting-details strong { color: #374151; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🗓️ Nova Reunião Agendada</h2>
                </div>
                
                <div class="content">
                    <p>Olá <strong>${recipientName}</strong>,</p>
                    
                    <p>Uma nova reunião foi agendada e você pode estar interessado:</p>
                    
                    <div class="info-box">
                        <h3 style="margin-top: 0; color: #374151;">${meetingData.titulo}</h3>
                        
                        <div class="meeting-details">
                            <p><strong>📅 Data/Hora:</strong> ${dataInicio} - ${dataFim}</p>
                            <p><strong>🏢 Sala:</strong> ${meetingData.sala_nome || 'Não informado'}</p>
                            <p><strong>👤 Responsável:</strong> ${meetingData.responsavel || 'Não informado'}</p>
                            <p><strong>👥 Participantes:</strong> ${meetingData.participantes || 'Não informado'} pessoas</p>
                            ${meetingData.link_reuniao ? `<p><strong>🔗 Link da Reunião:</strong> <a href="${meetingData.link_reuniao}">${meetingData.link_reuniao}</a></p>` : ''}
                            ${meetingData.descricao ? `<p><strong>📝 Descrição:</strong> ${meetingData.descricao}</p>` : ''}
                        </div>
                    </div>
                    
                    <p>Para mais detalhes sobre esta reunião, entre em contato com o responsável.</p>
                </div>
                
                <div class="footer">
                    <p>Sistema de Reuniões - Notificação Automática</p>
                    <p>Esta é uma mensagem automática, não responda este email.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const textBody = `
Nova Reunião Agendada: ${meetingData.titulo}

Olá ${recipientName},

Uma nova reunião foi agendada:

Título: ${meetingData.titulo}
Data/Hora: ${dataInicio} - ${dataFim}
Sala: ${meetingData.sala_nome || 'Não informado'}
Responsável: ${meetingData.responsavel || 'Não informado'}
Participantes: ${meetingData.participantes || 'Não informado'} pessoas
${meetingData.link_reuniao ? `Link: ${meetingData.link_reuniao}` : ''}
${meetingData.descricao ? `Descrição: ${meetingData.descricao}` : ''}

Sistema de Reuniões - Notificação Automática
      `;

      const mailOptions = {
        from: `"${this.fromName}" <${this.emailUser}>`,
        to: recipientEmail,
        subject: `Nova Reunião Agendada: ${meetingData.titulo}`,
        text: textBody,
        html: htmlBody
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email de nova reunião enviado para ${recipientEmail}`);
      return true;

    } catch (error) {
      console.error('Erro ao enviar email de nova reunião:', error);
      return false;
    }
  }

  async sendMeetingCancellationNotification(meetingData, recipientEmail, recipientName) {
    if (!this.emailUser || !this.emailPassword) {
      console.log('Serviço de email não configurado');
      return false;
    }

    try {
      const transporter = this._createTransporter();
      if (!transporter) {
        return false;
      }

      const dataInicio = this._formatDateTime(meetingData.data_inicio);
      const dataFim = this._formatDateTime(meetingData.data_fim);

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #fef2f2; padding: 20px; border: 1px solid #fecaca; }
                .footer { background-color: #dc2626; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; }
                .meeting-details { margin: 15px 0; }
                .meeting-details strong { color: #dc2626; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>❌ Reunião Cancelada</h2>
                </div>
                
                <div class="content">
                    <p>Olá <strong>${recipientName}</strong>,</p>
                    
                    <p>A seguinte reunião foi <strong>cancelada</strong>:</p>
                    
                    <div class="info-box">
                        <h3 style="margin-top: 0; color: #dc2626;">${meetingData.titulo}</h3>
                        
                        <div class="meeting-details">
                            <p><strong>📅 Data/Hora:</strong> ${dataInicio} - ${dataFim}</p>
                            <p><strong>🏢 Sala:</strong> ${meetingData.sala_nome || 'Não informado'}</p>
                            <p><strong>👤 Responsável:</strong> ${meetingData.responsavel || 'Não informado'}</p>
                            <p><strong>👥 Participantes:</strong> ${meetingData.participantes || 'Não informado'} pessoas</p>
                            ${meetingData.link_reuniao ? `<p><strong>🔗 Link da Reunião:</strong> <s>${meetingData.link_reuniao}</s></p>` : ''}
                        </div>
                    </div>
                    
                    <p><strong>⚠️ Esta reunião não acontecerá mais. Por favor, ajuste sua agenda.</strong></p>
                </div>
                
                <div class="footer">
                    <p>Sistema de Reuniões - Notificação Automática</p>
                    <p>Esta é uma mensagem automática, não responda este email.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const textBody = `
Reunião Cancelada: ${meetingData.titulo}

Olá ${recipientName},

A seguinte reunião foi CANCELADA:

Título: ${meetingData.titulo}
Data/Hora: ${dataInicio} - ${dataFim}
Sala: ${meetingData.sala_nome || 'Não informado'}
Responsável: ${meetingData.responsavel || 'Não informado'}

Esta reunião não acontecerá mais. Por favor, ajuste sua agenda.

Sistema de Reuniões - Notificação Automática
      `;

      const mailOptions = {
        from: `"${this.fromName}" <${this.emailUser}>`,
        to: recipientEmail,
        subject: `Reunião Cancelada: ${meetingData.titulo}`,
        text: textBody,
        html: htmlBody
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email de cancelamento enviado para ${recipientEmail}`);
      return true;

    } catch (error) {
      console.error('Erro ao enviar email de cancelamento:', error);
      return false;
    }
  }

  async notifyMultipleUsers(meetingData, notificationType = 'new') {
    if (this.notificationEmails.length === 0) {
      console.log('Nenhum email configurado para notificação');
      return;
    }

    for (const email of this.notificationEmails) {
      try {
        // Extrair nome do email (parte antes do @)
        const name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        if (notificationType === 'new') {
          await this.sendNewMeetingNotification(meetingData, email, name);
        } else if (notificationType === 'cancel') {
          await this.sendMeetingCancellationNotification(meetingData, email, name);
        }
      } catch (error) {
        console.error(`Erro ao notificar ${email}:`, error);
      }
    }
  }

  isConfigured() {
    return !!(this.emailUser && this.emailPassword);
  }
}

// Instância global do serviço
export const emailService = new EmailService();
