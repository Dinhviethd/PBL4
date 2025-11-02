import nodemailer from 'nodemailer';
import { AppError } from '@/utils/error.response';

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address
                pass: process.env.EMAIL_PASS  // Your Gmail app password
            }
        });
    }

    async sendPasswordResetConfirmationEmail(email: string, confirmationLink: string): Promise<void> {
        try {
            const mailOptions = {
                from: {
                    name: 'ChatMate',
                    address: process.env.EMAIL_USER || 'noreply@chatmate.com'
                },
                to: email,
                subject: 'Xác nhận thay đổi mật khẩu - ChatMate',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">ChatMate</h1>
                            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Xác nhận thay đổi mật khẩu</p>
                        </div>
                        
                        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; margin-top: 0;">Xin chào!</h2>
                            
                            <p>Bạn đã yêu cầu thay đổi mật khẩu cho tài khoản ChatMate của mình.</p>
                            
                            <p><strong>Để hoàn tất việc thay đổi mật khẩu, vui lòng nhấn vào nút bên dưới:</strong></p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${confirmationLink}" 
                                   target="_self"
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          font-weight: bold; 
                                          font-size: 16px;
                                          display: inline-block;
                                          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                                          transition: all 0.3s ease;">
                                    Xác nhận thay đổi mật khẩu
                                </a>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                <strong>Lưu ý quan trọng:</strong>
                            </p>
                            <ul style="color: #666; font-size: 14px;">
                                <li>Link này sẽ hết hạn sau 24 giờ</li>
                                <li>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này</li>
                                <li>Không chia sẻ link này với bất kỳ ai</li>
                            </ul>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                Nếu nút không hoạt động, bạn có thể copy và paste link sau vào trình duyệt:
                            </p>
                            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #666;">
                                ${confirmationLink}
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                            <p>© 2025 ChatMate. Kết nối mọi người, mọi lúc, mọi nơi.</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Password reset confirmation email sent to: ${email}`);

        } catch (error) {
            console.error('Error sending email:', error);
            throw new AppError(500, 'Failed to send confirmation email');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email service connection successful');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }
}

export default new EmailService();