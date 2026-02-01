/**
 * 日期时间工具类
 * 提供UTC时间与本地时间转换等功能
 */

/**
 * 将UTC时间转换为本地时间
 * @param utcTime UTC时间字符串
 * @returns 转换后的本地时间字符串，格式为YYYY-MM-DD HH:MM:SS
 */
export function convertUtcToLocal(utcTime: string): string {
  if (!utcTime) return utcTime;
  
  // 创建Date对象（会自动处理时区转换）
  const date = new Date(utcTime);
  
  // 格式化时间为YYYY-MM-DD HH:MM:SS格式
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期时间
 * @param date 日期对象或日期字符串
 * @param format 格式化字符串，默认为YYYY-MM-DD HH:MM:SS
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string, format: string = 'YYYY-MM-DD HH:MM:SS'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取当前本地时间
 * @param format 格式化字符串，默认为YYYY-MM-DD HH:mm:ss
 * @returns 当前本地时间字符串
 */
export function getCurrentLocalTime(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return formatDateTime(new Date(), format);
}

/**
 * 获取当前本地时间（SQLite兼容格式）
 * @returns 当前本地时间字符串，格式为YYYY-MM-DD HH:mm:ss
 */
export function getCurrentLocalTimeForSqlite(): string {
  return getCurrentLocalTime('YYYY-MM-DD HH:mm:ss');
}

/**
 * 获取当前UTC时间
 * @param format 格式化字符串，默认为YYYY-MM-DD HH:mm:ss
 * @returns 当前UTC时间字符串
 */
export function getCurrentUtcTime(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const now = new Date();
  return formatDateTime(
    new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
             now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()),
    format
  );
}
