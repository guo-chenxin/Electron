import nodemailer from 'nodemailer';

// 邮件服务配置接口
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// 验证码邮件模板
export interface VerificationCodeEmailTemplate {
  to: string;
  code: string;
  expiresIn: number; // 过期时间（分钟）
}

// 邮件服务类
export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  private readonly config: EmailConfig;

  private constructor() {
    // 配置邮件服务器
    // 注意：在生产环境中，这些配置应该从环境变量或配置文件中读取
    this.config = {
      host: 'smtp.qq.com', // 使用QQ邮箱SMTP服务器
      port: 587, // 587端口使用TLS加密
      secure: false, // 587端口使用STARTTLS，不是直接的SSL
      auth: {
        user: '3082086958@qq.com', // 你的QQ邮箱
        pass: 'ehpjxiopgskdddie' // 你的QQ邮箱授权码
      },
      from: '3082086958@qq.com' // 发件人邮箱，与登录账号一致
    };

    // 创建邮件传输器
    this.transporter = nodemailer.createTransport(this.config);
  }

  // 获取单例实例
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // 发送验证码邮件
  public async sendVerificationCode(emailTemplate: VerificationCodeEmailTemplate): Promise<boolean> {
    try {
      // 渲染邮件模板
      const html = this.renderVerificationCodeTemplate(emailTemplate);

      // 发送邮件
      await this.transporter.sendMail({
        from: this.config.from,
        to: emailTemplate.to,
        subject: '[Electron] 登录验证码',
        html
      });

      console.log(`[邮件服务] 验证码已发送到 ${emailTemplate.to}`);
      return true;
    } catch (error) {
      console.error('[邮件服务] 发送验证码失败:', error);
      return false;
    }
  }

  // 渲染验证码邮件模板
  private renderVerificationCodeTemplate(data: VerificationCodeEmailTemplate): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">登录验证码</h2>
        <p>您好，</p>
        <p>您正在使用邮箱验证码登录系统，您的验证码是：</p>
        <div style="font-size: 24px; font-weight: bold; color: #409eff; margin: 20px 0;">
          ${data.code}
        </div>
        <p>验证码有效期为 ${data.expiresIn} 分钟，请尽快使用。</p>
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
        <br>
        <p>此致</p>
        <p>Electron 团队</p>
      </div>
    `;
  }

  // 验证邮箱格式
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();
