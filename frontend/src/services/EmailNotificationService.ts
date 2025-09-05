// Email Notification Service for CineBook
// Handles email confirmations, receipts, and notifications (frontend simulation)

import { ETicketData } from './QRCodeService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'booking_confirmation' | 'payment_receipt' | 'reminder' | 'cancellation' | 'promotional';
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  attachments?: EmailAttachment[];
  priority: 'low' | 'normal' | 'high';
  tags: string[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  encoding?: 'base64' | 'binary';
}

export interface EmailResponse {
  success: boolean;
  messageId: string;
  timestamp: number;
  recipient: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  error?: string;
}

export interface EmailLog {
  id: string;
  templateId: string;
  recipient: string;
  subject: string;
  status: EmailResponse['status'];
  sentAt: number;
  deliveredAt?: number;
  openedAt?: number;
  clickCount: number;
  metadata: Record<string, any>;
}

export interface BookingEmailData {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  movieTitle: string;
  theater: string;
  showDate: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  eTicket?: ETicketData;
}

class EmailNotificationService {
  private static instance: EmailNotificationService;
  private templates: Map<string, EmailTemplate>;
  private emailLogs: EmailLog[];
  private isConfigured: boolean;

  private constructor() {
    this.templates = new Map();
    this.emailLogs = [];
    this.isConfigured = false;
    this.initializeTemplates();
  }

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  // Initialize email templates
  private initializeTemplates(): void {
    // Booking Confirmation Template
    this.templates.set('booking_confirmation', {
      id: 'booking_confirmation',
      name: 'Booking Confirmation',
      subject: '🎬 Your CineBook Booking Confirmation - {{bookingCode}}',
      type: 'booking_confirmation',
      htmlTemplate: this.getBookingConfirmationHtml(),
      textTemplate: this.getBookingConfirmationText(),
      variables: ['customerName', 'bookingCode', 'movieTitle', 'theater', 'showDate', 'showTime', 'seats', 'totalAmount']
    });

    // Payment Receipt Template
    this.templates.set('payment_receipt', {
      id: 'payment_receipt',
      name: 'Payment Receipt',
      subject: '🧾 Payment Receipt - {{bookingCode}}',
      type: 'payment_receipt',
      htmlTemplate: this.getPaymentReceiptHtml(),
      textTemplate: this.getPaymentReceiptText(),
      variables: ['customerName', 'bookingCode', 'totalAmount', 'paymentMethod', 'transactionId']
    });

    // Show Reminder Template
    this.templates.set('show_reminder', {
      id: 'show_reminder',
      name: 'Show Reminder',
      subject: '⏰ Reminder: Your movie starts in 2 hours - {{movieTitle}}',
      type: 'reminder',
      htmlTemplate: this.getShowReminderHtml(),
      textTemplate: this.getShowReminderText(),
      variables: ['customerName', 'movieTitle', 'theater', 'showTime', 'seats']
    });

    // Booking Cancellation Template
    this.templates.set('booking_cancellation', {
      id: 'booking_cancellation',
      name: 'Booking Cancellation',
      subject: '❌ Booking Cancelled - {{bookingCode}}',
      type: 'cancellation',
      htmlTemplate: this.getBookingCancellationHtml(),
      textTemplate: this.getBookingCancellationText(),
      variables: ['customerName', 'bookingCode', 'movieTitle', 'refundAmount']
    });

    this.isConfigured = true;
  }

  // Send booking confirmation email
  public async sendBookingConfirmation(bookingData: BookingEmailData): Promise<EmailResponse> {
    const template = this.templates.get('booking_confirmation');
    if (!template) {
      throw new Error('Booking confirmation template not found');
    }

    const emailData = this.prepareEmailData(template, bookingData, {
      customerName: bookingData.customerName,
      bookingCode: bookingData.bookingCode,
      movieTitle: bookingData.movieTitle,
      theater: bookingData.theater,
      showDate: bookingData.showDate,
      showTime: bookingData.showTime,
      seats: bookingData.seats.join(', '),
      totalAmount: this.formatAmount(bookingData.totalAmount, bookingData.currency)
    });

    // Add e-ticket as attachment if available
    if (bookingData.eTicket) {
      emailData.attachments = [
        {
          filename: `e-ticket-${bookingData.bookingCode}.pdf`,
          content: 'base64_encoded_pdf_content_here', // In real implementation, generate PDF
          contentType: 'application/pdf',
          encoding: 'base64'
        }
      ];
    }

    return this.sendEmail(emailData, bookingData.customerEmail, template.id, bookingData);
  }

  // Send payment receipt email
  public async sendPaymentReceipt(
    bookingData: BookingEmailData,
    transactionId: string
  ): Promise<EmailResponse> {
    const template = this.templates.get('payment_receipt');
    if (!template) {
      throw new Error('Payment receipt template not found');
    }

    const emailData = this.prepareEmailData(template, bookingData, {
      customerName: bookingData.customerName,
      bookingCode: bookingData.bookingCode,
      totalAmount: this.formatAmount(bookingData.totalAmount, bookingData.currency),
      paymentMethod: bookingData.paymentMethod,
      transactionId: transactionId
    });

    return this.sendEmail(emailData, bookingData.customerEmail, template.id, bookingData);
  }

  // Send show reminder email
  public async sendShowReminder(bookingData: BookingEmailData): Promise<EmailResponse> {
    const template = this.templates.get('show_reminder');
    if (!template) {
      throw new Error('Show reminder template not found');
    }

    const emailData = this.prepareEmailData(template, bookingData, {
      customerName: bookingData.customerName,
      movieTitle: bookingData.movieTitle,
      theater: bookingData.theater,
      showTime: bookingData.showTime,
      seats: bookingData.seats.join(', ')
    });

    return this.sendEmail(emailData, bookingData.customerEmail, template.id, bookingData);
  }

  // Send booking cancellation email
  public async sendBookingCancellation(
    bookingData: BookingEmailData,
    refundAmount: number
  ): Promise<EmailResponse> {
    const template = this.templates.get('booking_cancellation');
    if (!template) {
      throw new Error('Booking cancellation template not found');
    }

    const emailData = this.prepareEmailData(template, bookingData, {
      customerName: bookingData.customerName,
      bookingCode: bookingData.bookingCode,
      movieTitle: bookingData.movieTitle,
      refundAmount: this.formatAmount(refundAmount, bookingData.currency)
    });

    return this.sendEmail(emailData, bookingData.customerEmail, template.id, bookingData);
  }

  // Prepare email data from template
  private prepareEmailData(
    template: EmailTemplate,
    bookingData: BookingEmailData,
    variables: Record<string, string>
  ): EmailData {
    const subject = this.replaceVariables(template.subject, variables);
    const htmlContent = this.replaceVariables(template.htmlTemplate, variables);
    const textContent = this.replaceVariables(template.textTemplate, variables);

    return {
      to: bookingData.customerEmail,
      subject,
      htmlContent,
      textContent,
      priority: 'normal',
      tags: [template.type, 'automated']
    };
  }

  // Replace template variables
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  // Simulate sending email
  private async sendEmail(
    emailData: EmailData,
    recipient: string,
    templateId: string,
    metadata: any
  ): Promise<EmailResponse> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const messageId = this.generateMessageId();
    const timestamp = Date.now();

    // Simulate occasional email failures (5% chance)
    const success = Math.random() > 0.05;

    const response: EmailResponse = {
      success,
      messageId,
      timestamp,
      recipient,
      status: success ? 'sent' : 'failed',
      error: success ? undefined : 'SMTP server temporarily unavailable'
    };

    // Log the email
    this.logEmail({
      id: messageId,
      templateId,
      recipient,
      subject: emailData.subject,
      status: response.status,
      sentAt: timestamp,
      clickCount: 0,
      metadata
    });

    // Simulate email delivery after sending
    if (success) {
      setTimeout(() => {
        this.updateEmailStatus(messageId, 'delivered');
      }, 5000 + Math.random() * 10000);

      // Simulate email opening (30% chance within 24 hours)
      if (Math.random() < 0.3) {
        setTimeout(() => {
          this.updateEmailStatus(messageId, 'opened');
        }, 60000 + Math.random() * 86400000);
      }
    }

    console.log('Email sent:', response);
    return response;
  }

  // Generate unique message ID
  private generateMessageId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}.${random}@cinebook.local`;
  }

  // Log email for tracking
  private logEmail(log: EmailLog): void {
    this.emailLogs.push(log);
    
    // Keep only last 1000 logs
    if (this.emailLogs.length > 1000) {
      this.emailLogs = this.emailLogs.slice(-1000);
    }
  }

  // Update email status
  private updateEmailStatus(messageId: string, status: EmailResponse['status']): void {
    const log = this.emailLogs.find(l => l.id === messageId);
    if (log) {
      log.status = status;
      if (status === 'delivered') {
        log.deliveredAt = Date.now();
      } else if (status === 'opened') {
        log.openedAt = Date.now();
      }
    }
  }

  // Get email logs
  public getEmailLogs(limit: number = 50): EmailLog[] {
    return this.emailLogs
      .sort((a, b) => b.sentAt - a.sentAt)
      .slice(0, limit);
  }

  // Get email statistics
  public getEmailStatistics(): Record<string, any> {
    const total = this.emailLogs.length;
    const sent = this.emailLogs.filter(l => l.status === 'sent' || l.status === 'delivered' || l.status === 'opened').length;
    const delivered = this.emailLogs.filter(l => l.status === 'delivered' || l.status === 'opened').length;
    const opened = this.emailLogs.filter(l => l.status === 'opened').length;
    const failed = this.emailLogs.filter(l => l.status === 'failed').length;

    return {
      total,
      sent,
      delivered,
      opened,
      failed,
      deliveryRate: total > 0 ? (delivered / total * 100).toFixed(2) : 0,
      openRate: delivered > 0 ? (opened / delivered * 100).toFixed(2) : 0,
      failureRate: total > 0 ? (failed / total * 100).toFixed(2) : 0
    };
  }

  // Format amount for display
  private formatAmount(amount: number, currency: string = 'VND'): string {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Email template HTML content
  private getBookingConfirmationHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #e50914, #b81319); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; }
          .movie-title { font-size: 24px; font-weight: bold; color: #e50914; margin-bottom: 20px; }
          .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #333; }
          .value { color: #666; }
          .total { font-size: 18px; font-weight: bold; color: #e50914; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .qr-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎬 CINEBOOK</div>
            <h1>Booking Confirmed!</h1>
            <p>Thank you for choosing CineBook</p>
          </div>
          
          <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Your movie booking has been confirmed! Here are your booking details:</p>
            
            <div class="movie-title">{{movieTitle}}</div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Booking Code:</span>
                <span class="value">{{bookingCode}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Theater:</span>
                <span class="value">{{theater}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date & Time:</span>
                <span class="value">{{showDate}} at {{showTime}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Seats:</span>
                <span class="value">{{seats}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Amount:</span>
                <span class="value total">{{totalAmount}}</span>
              </div>
            </div>
            
            <div class="qr-note">
              <strong>📱 E-Ticket Attached</strong><br>
              Your e-ticket with QR code is attached to this email. Please show it at the theater entrance for quick entry.
            </div>
            
            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>Please arrive at the theater 15 minutes before showtime</li>
              <li>Present your e-ticket and valid ID at the entrance</li>
              <li>Outside food and beverages are not allowed</li>
              <li>Use of mobile phones during the movie is prohibited</li>
            </ul>
            
            <p>We hope you enjoy your movie experience!</p>
          </div>
          
          <div class="footer">
            <p>CineBook - Your Ultimate Movie Experience</p>
            <p>Visit us at www.cinebook.com | Call: 1900-CINEMA</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Email template text content
  private getBookingConfirmationText(): string {
    return `
      CINEBOOK - BOOKING CONFIRMATION
      
      Dear {{customerName}},
      
      Your movie booking has been confirmed!
      
      BOOKING DETAILS:
      ================
      Movie: {{movieTitle}}
      Booking Code: {{bookingCode}}
      Theater: {{theater}}
      Date & Time: {{showDate}} at {{showTime}}
      Seats: {{seats}}
      Total Amount: {{totalAmount}}
      
      IMPORTANT REMINDERS:
      ===================
      - Please arrive at the theater 15 minutes before showtime
      - Present your e-ticket and valid ID at the entrance
      - Outside food and beverages are not allowed
      - Use of mobile phones during the movie is prohibited
      
      Your e-ticket with QR code is attached to this email.
      
      Thank you for choosing CineBook!
      
      --
      CineBook - Your Ultimate Movie Experience
      www.cinebook.com | 1900-CINEMA
    `;
  }

  private getPaymentReceiptHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #46d369; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .receipt-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful</h1>
            <p>Receipt for Booking {{bookingCode}}</p>
          </div>
          <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Your payment has been processed successfully. Here's your receipt:</p>
            <div class="receipt-details">
              <div class="detail-row">
                <span>Amount Paid:</span>
                <span><strong>{{totalAmount}}</strong></span>
              </div>
              <div class="detail-row">
                <span>Payment Method:</span>
                <span>{{paymentMethod}}</span>
              </div>
              <div class="detail-row">
                <span>Transaction ID:</span>
                <span>{{transactionId}}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>CineBook - Your Ultimate Movie Experience</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentReceiptText(): string {
    return `
      CINEBOOK - PAYMENT RECEIPT
      
      Dear {{customerName}},
      
      Your payment has been processed successfully.
      
      PAYMENT DETAILS:
      ===============
      Amount Paid: {{totalAmount}}
      Payment Method: {{paymentMethod}}
      Transaction ID: {{transactionId}}
      
      Thank you for your payment!
      
      --
      CineBook
    `;
  }

  private getShowReminderHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Show Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #ff9500; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .reminder-details { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Show Reminder</h1>
            <p>Your movie starts in 2 hours!</p>
          </div>
          <div class="content">
            <p>Dear {{customerName}},</p>
            <p>This is a friendly reminder that your movie starts soon:</p>
            <div class="reminder-details">
              <h3>{{movieTitle}}</h3>
              <p><strong>Theater:</strong> {{theater}}</p>
              <p><strong>Show Time:</strong> {{showTime}}</p>
              <p><strong>Your Seats:</strong> {{seats}}</p>
            </div>
            <p>Please arrive 15 minutes early with your e-ticket and ID.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getShowReminderText(): string {
    return `
      CINEBOOK - SHOW REMINDER
      
      Dear {{customerName}},
      
      Your movie starts in 2 hours!
      
      SHOW DETAILS:
      ============
      Movie: {{movieTitle}}
      Theater: {{theater}}
      Show Time: {{showTime}}
      Your Seats: {{seats}}
      
      Please arrive 15 minutes early with your e-ticket and ID.
      
      --
      CineBook
    `;
  }

  private getBookingCancellationHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Cancellation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #ff3b30; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .cancellation-details { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Booking Cancelled</h1>
            <p>Booking {{bookingCode}} has been cancelled</p>
          </div>
          <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Your booking for "{{movieTitle}}" has been cancelled.</p>
            <div class="cancellation-details">
              <p><strong>Refund Amount:</strong> {{refundAmount}}</p>
              <p>The refund will be processed within 3-5 business days.</p>
            </div>
            <p>We apologize for any inconvenience. We hope to serve you again soon!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getBookingCancellationText(): string {
    return `
      CINEBOOK - BOOKING CANCELLATION
      
      Dear {{customerName}},
      
      Your booking for "{{movieTitle}}" has been cancelled.
      
      REFUND DETAILS:
      ==============
      Refund Amount: {{refundAmount}}
      
      The refund will be processed within 3-5 business days.
      
      We apologize for any inconvenience.
      
      --
      CineBook
    `;
  }

  // Test email configuration
  public testEmailConfiguration(): boolean {
    return this.isConfigured;
  }

  // Get available templates
  public getAvailableTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }
}

// Export singleton instance
export const emailNotificationService = EmailNotificationService.getInstance();

// React Hook for email notifications
export function useEmailNotification() {
  const sendBookingConfirmation = async (bookingData: BookingEmailData): Promise<EmailResponse> => {
    return emailNotificationService.sendBookingConfirmation(bookingData);
  };

  const sendPaymentReceipt = async (
    bookingData: BookingEmailData,
    transactionId: string
  ): Promise<EmailResponse> => {
    return emailNotificationService.sendPaymentReceipt(bookingData, transactionId);
  };

  const sendShowReminder = async (bookingData: BookingEmailData): Promise<EmailResponse> => {
    return emailNotificationService.sendShowReminder(bookingData);
  };

  const sendBookingCancellation = async (
    bookingData: BookingEmailData,
    refundAmount: number
  ): Promise<EmailResponse> => {
    return emailNotificationService.sendBookingCancellation(bookingData, refundAmount);
  };

  const getEmailLogs = (limit?: number): EmailLog[] => {
    return emailNotificationService.getEmailLogs(limit);
  };

  const getEmailStatistics = () => {
    return emailNotificationService.getEmailStatistics();
  };

  const testConfiguration = (): boolean => {
    return emailNotificationService.testEmailConfiguration();
  };

  return {
    sendBookingConfirmation,
    sendPaymentReceipt,
    sendShowReminder,
    sendBookingCancellation,
    getEmailLogs,
    getEmailStatistics,
    testConfiguration
  };
}

export default emailNotificationService;