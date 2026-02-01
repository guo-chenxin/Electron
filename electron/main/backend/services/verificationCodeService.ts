// 验证码服务类
import crypto from 'crypto';
import { emailService } from './emailService';

// 验证码存储接口
interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
}

// 验证码服务类
export class VerificationCodeService {
  private static instance: VerificationCodeService;
  private verificationCodes: Map<string, VerificationCode> = new Map(); // 验证码存储，key: email
  private sendRecords: Map<string, number> = new Map(); // 防刷记录，key: ip+email, value: sentAt
  private readonly CODE_EXPIRY_TIME = 5 * 60 * 1000; // 5分钟
  private readonly CODE_LENGTH = 6;
  private readonly SEND_COOLDOWN = 60 * 1000; // 60秒冷却时间

  private constructor() {
    // 定期清理过期的验证码和发送记录
    setInterval(() => {
      this.cleanupExpiredCodes();
      this.cleanupExpiredSendRecords();
    }, 60 * 1000); // 每分钟清理一次
  }

  public static getInstance(): VerificationCodeService {
    if (!VerificationCodeService.instance) {
      VerificationCodeService.instance = new VerificationCodeService();
    }
    return VerificationCodeService.instance;
  }

  // 生成验证码
  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // 发送验证码（真实邮件发送）
  public async sendVerificationCode(email: string, ip: string = '127.0.0.1'): Promise<boolean> {
    console.log('=== 发送验证码流程开始 ===');
    console.log('原始邮箱:', email);
    
    // 统一邮箱地址为小写
    const normalizedEmail = email.toLowerCase();
    console.log('标准化后的邮箱:', normalizedEmail);
    
    // 验证邮箱格式
    if (!emailService.validateEmail(normalizedEmail)) {
      console.error('[验证码服务] 邮箱格式无效:', email);
      throw new Error('邮箱格式无效');
    }

    // 检查防刷限制
    const key = `${ip}:${normalizedEmail}`;
    console.log('防刷记录key:', key);
    const sentAt = this.sendRecords.get(key);
    console.log('上次发送时间:', sentAt ? new Date(sentAt).toLocaleString() : '从未发送');
    
    if (sentAt && Date.now() - sentAt < this.SEND_COOLDOWN) {
      console.error('[验证码服务] 发送过于频繁，请稍后重试:', email);
      throw new Error('发送过于频繁，请稍后重试');
    }

    // 生成6位随机验证码
    const code = this.generateCode();
    const expiresAt = Date.now() + this.CODE_EXPIRY_TIME;
    console.log('生成的验证码:', code);
    console.log('验证码过期时间:', new Date(expiresAt).toLocaleString());
    
    // 发送真实邮件
    try {
      console.log('开始发送邮件...');
      await emailService.sendVerificationCode({
        to: email,
        code,
        expiresIn: 5 // 5分钟过期
      });
      
      console.log('邮件发送成功');
      
      // 只有发送邮件成功后才存储验证码
      this.verificationCodes.set(normalizedEmail, { email: normalizedEmail, code, expiresAt });
      console.log('验证码存储成功，当前存储的验证码数量:', this.verificationCodes.size);
      
      // 记录发送记录
      this.sendRecords.set(key, Date.now());
      console.log('发送记录存储成功');
      
      // 打印当前存储的所有验证码
      console.log('当前存储的验证码:');
      for (const [email, codeInfo] of this.verificationCodes.entries()) {
        console.log(`  ${email}: ${codeInfo.code} (过期时间: ${new Date(codeInfo.expiresAt).toLocaleString()})`);
      }
      
      console.log('=== 发送验证码流程结束 ===');
      return true;
    } catch (error) {
      console.error('[验证码服务] 发送邮件失败:', error);
      throw new Error('发送邮件失败，请稍后重试');
    }
  }

  // 验证验证码
  public verifyCode(email: string, code: string): boolean {
    // 统一邮箱地址为小写
    const normalizedEmail = email.toLowerCase();
    
    console.log(`[验证码服务] 开始验证，邮箱: ${normalizedEmail}，输入的验证码: ${code}`);
    
    // 从内存获取验证码
    const verificationCode = this.verificationCodes.get(normalizedEmail);
    
    if (!verificationCode) {
      console.log('[验证码服务] 未找到验证码记录');
      return false;
    }
    
    console.log(`[验证码服务] 找到验证码记录，存储的验证码: ${verificationCode.code}，过期时间: ${new Date(verificationCode.expiresAt).toLocaleString()}`);
    
    // 检查验证码是否过期
    if (Date.now() > verificationCode.expiresAt) {
      console.log('[验证码服务] 验证码已过期');
      // 删除过期验证码
      this.verificationCodes.delete(normalizedEmail);
      return false;
    }
    
    // 检查验证码是否匹配
    const isMatch = verificationCode.code === code;
    console.log(`[验证码服务] 验证码匹配结果: ${isMatch}`);
    
    // 如果匹配，移除验证码（防止重复使用）并删除发送记录
    if (isMatch) {
      console.log('[验证码服务] 验证码验证成功，删除验证码记录和发送记录');
      this.verificationCodes.delete(normalizedEmail);
      
      // 删除对应的发送记录，使用户可以立即再次发送验证码
      // 遍历发送记录，找到包含当前邮箱的记录并删除
      for (const [key, _] of this.sendRecords.entries()) {
        if (key.includes(`:${normalizedEmail}`)) {
          this.sendRecords.delete(key);
          console.log(`[验证码服务] 已删除发送记录: ${key}`);
          break;
        }
      }
    }
    
    return isMatch;
  }

  // 清理过期的验证码
  private cleanupExpiredCodes(): void {
    const now = Date.now();
    let deleted = 0;
    
    for (const [email, code] of this.verificationCodes.entries()) {
      if (now > code.expiresAt) {
        this.verificationCodes.delete(email);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      console.log(`[验证码服务] 清理了 ${deleted} 个过期验证码`);
    }
  }

  // 清理过期的发送记录
  private cleanupExpiredSendRecords(): void {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, sentAt] of this.sendRecords.entries()) {
      if (now - sentAt > this.SEND_COOLDOWN) {
        this.sendRecords.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      console.log(`[验证码服务] 清理了 ${deleted} 个过期发送记录`);
    }
  }
}

// 导出单例实例
export const verificationCodeService = VerificationCodeService.getInstance();
