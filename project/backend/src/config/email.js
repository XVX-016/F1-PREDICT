import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@f1predict.com';
const FROM_NAME = process.env.FROM_NAME || 'F1 Predict';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid email service configured');
} else {
  console.log('⚠️  SendGrid API key not found. Email service will use mock mode.');
}

// Email templates
const emailTemplates = {
  passwordReset: {
    subject: 'Reset Your F1 Predict Password',
    html: (resetLink, userName) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 10px; 
            overflow: hidden; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .greeting { 
            font-size: 18px; 
            margin-bottom: 20px; 
            color: #374151; 
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 30px; 
            color: #6b7280; 
            line-height: 1.7; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            text-decoration: none; 
            padding: 15px 30px; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            margin: 20px 0; 
            transition: transform 0.2s ease; 
          }
          .button:hover { 
            transform: translateY(-2px); 
          }
          .warning { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #92400e; 
          }
          .footer { 
            background: #f9fafb; 
            padding: 20px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏎️ F1 PREDICT</div>
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Hello ${userName || 'there'}!</div>
            
            <div class="message">
              We received a request to reset your password for your F1 Predict account. 
              If you didn't make this request, you can safely ignore this email.
            </div>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security. 
              If you need a new link, please request another password reset.
            </div>
            
            <div class="message">
              If the button above doesn't work, you can copy and paste this link into your browser:
              <br><br>
              <a href="${resetLink}" style="color: #dc2626; word-break: break-all;">${resetLink}</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent from F1 Predict. Please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (resetLink, userName) => `
      F1 PREDICT - Password Reset Request
      
      Hello ${userName || 'there'}!
      
      We received a request to reset your password for your F1 Predict account. 
      If you didn't make this request, you can safely ignore this email.
      
      To reset your password, click the following link:
      ${resetLink}
      
      This link will expire in 1 hour for your security.
      
      If you have any questions, please contact our support team.
      
      Best regards,
      The F1 Predict Team
    `
  }
};

// Email service class
class EmailService {
  constructor() {
    this.isConfigured = !!SENDGRID_API_KEY;
  }

  // Send password reset email
  async sendPasswordResetEmail(toEmail, resetLink, userName = '') {
    try {
      if (!this.isConfigured) {
        console.log(`📧 [MOCK] Password reset email would be sent to ${toEmail}`);
        console.log(`📧 [MOCK] Reset link: ${resetLink}`);
        return { success: true, message: 'Mock email sent (SendGrid not configured)' };
      }

      const template = emailTemplates.passwordReset;
      const msg = {
        to: toEmail,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        subject: template.subject,
        html: template.html(resetLink, userName),
        text: template.text(resetLink, userName)
      };

      await sgMail.send(msg);
      console.log(`📧 Password reset email sent to ${toEmail}`);
      
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email (for future use)
  async sendWelcomeEmail(toEmail, userName) {
    try {
      if (!this.isConfigured) {
        console.log(`📧 [MOCK] Welcome email would be sent to ${toEmail}`);
        return { success: true, message: 'Mock email sent (SendGrid not configured)' };
      }

      // TODO: Implement welcome email template
      console.log(`📧 Welcome email sent to ${toEmail}`);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}

export default new EmailService();
