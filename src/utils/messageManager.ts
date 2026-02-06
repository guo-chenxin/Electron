import { ElMessage, MessageParams } from 'element-plus';

// 消息管理类，确保同一时间只显示一个消息
class MessageManager {
  private static instance: MessageManager;
  private lastMessageTime: number = 0;
  private lastMessageType: string | null = null;
  private messageInterval: number = 1000; // 1秒内不重复显示相同类型的消息
  private messageInstance: any = null;

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  // 显示消息
  public show(type: 'success' | 'warning' | 'error' | 'info', message: string, duration: number = 3000): void {
    const now = Date.now();
    
    // 检查是否在消息间隔内且消息类型相同
    if (now - this.lastMessageTime < this.messageInterval && type === this.lastMessageType) {
      return;
    }

    // 关闭之前的消息
    if (this.messageInstance) {
      this.messageInstance.close();
    }

    // 显示新消息
    this.messageInstance = ElMessage({
      type,
      message,
      duration,
      onClose: () => {
        this.messageInstance = null;
      }
    });

    // 更新最后消息时间和类型
    this.lastMessageTime = now;
    this.lastMessageType = type;
  }

  // 快捷方法
  public success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  public warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  public error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  public info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }
}

// 导出单例实例
export const messageManager = MessageManager.getInstance();
