import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private smtpServer: string;
  private smtpPort: number;
  private emailUser: string;
  private emailPassword: string;
  private fromName: string;
  private notificationEmails: string[];

  constructor(private configService: ConfigService) {
    this.smtpServer = this.configService.get('SMTP_SERVER') || 'smtp.gmail.com';
    this.smtpPort = parseInt(this.configService.get('SMTP_PORT') || '587');
    this.emailUser = this.configService.get('EMAIL_USER');
    this.emailPassword = this.configService.get('EMAIL_PASSWORD');
    this.fromName = this.configService.get('EMAIL_FROM_NAME') || 'Sistema de Reuniões';

    const notificationEmails = this.configService.get('NOTIFICATION_EMAILS') || '';
    this.notificationEmails = notificationEmails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (this.isConfigured()) {
      this.transporter = nodemailer.createTransport({
        host: this.smtpServer,
        port: this.smtpPort,
        secure: false,
        auth: {
          user: this.emailUser,
          pass: this.emailPassword,
        },
      });
    }
  }

  isConfigured(): boolean {
    return !!(this.emailUser && this.emailPassword);
  }

  private formatDateTime(dateString: string | Date): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });
    } catch (error) {
      return dateString.toString();
    }
  }

  async sendPasswordResetCode(email: string, nome: string, code: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('Serviço de email não configurado');
      return false;
    }

    try {
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
                .code-box { background-color: white; padding: 30px; margin: 20px 0; text-align: center; border: 2px dashed #374151; border-radius: 8px; }
                .code { font-size: 32px; font-weight: bold; color: #374151; letter-spacing: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔐 Recuperação de Senha</h2>
                </div>
                <div class="content">
                    <p>Olá <strong>${nome}</strong>,</p>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Reuniões.</p>
                    <p>Use o código abaixo para redefinir sua senha:</p>
                    <div class="code-box">
                        <div class="code">${code}</div>
                    </div>
                    <p>Após inserir o código, você poderá criar uma nova senha para sua conta.</p>
                </div>
                <div class="footer">
                    <p>Sistema de Reuniões - Notificação Automática</p>
                    <p>Esta é uma mensagem automática, não responda este email.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.emailUser}>`,
        to: email,
        subject: `Código de Recuperação de Senha - ${code}`,
        html: htmlBody,
      });

      console.log(`Email de recuperação de senha enviado para ${email}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      return false;
    }
  }

  async sendNewMeetingNotification(meetingData: any, recipientEmail: string, recipientName: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('Serviço de email não configurado');
      return false;
    }

    try {
      const dataInicio = this.formatDateTime(meetingData.data_inicio);
      const dataFim = this.formatDateTime(meetingData.data_fim);

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

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.emailUser}>`,
        to: recipientEmail,
        subject: `Nova Reunião Agendada: ${meetingData.titulo}`,
        html: htmlBody,
      });

      console.log(`Email de nova reunião enviado para ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de nova reunião:', error);
      return false;
    }
  }

  async sendMeetingCancellationNotification(meetingData: any, recipientEmail: string, recipientName: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('Serviço de email não configurado');
      return false;
    }

    try {
      const dataInicio = this.formatDateTime(meetingData.data_inicio);
      const dataFim = this.formatDateTime(meetingData.data_fim);

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

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.emailUser}>`,
        to: recipientEmail,
        subject: `Reunião Cancelada: ${meetingData.titulo}`,
        html: htmlBody,
      });

      console.log(`Email de cancelamento enviado para ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de cancelamento:', error);
      return false;
    }
  }

  async notifyMultipleUsers(meetingData: any, notificationType: 'new' | 'cancel' = 'new'): Promise<void> {
    if (this.notificationEmails.length === 0) {
      console.log('Nenhum email configurado para notificação');
      return;
    }

    for (const email of this.notificationEmails) {
      try {
        // Extrair nome do email (parte antes do @)
        const name = email
          .split('@')[0]
          .replace(/\./g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

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
}
