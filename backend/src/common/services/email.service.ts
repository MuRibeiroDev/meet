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

  // Adicione outros métodos de email conforme necessário
}
