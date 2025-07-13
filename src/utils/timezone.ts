/**
 * 時區工具函數
 * 提供統一的時區處理功能
 */

// 獲取當前設定的時區
export const getCurrentTimezone = (): string => {
  // 從 localStorage 獲取設定的時區，預設為台北時區
  const settings = localStorage.getItem('tomato-timer-settings');
  if (settings) {
    try {
      const parsedSettings = JSON.parse(settings);
      return parsedSettings.timezone || 'Asia/Taipei';
    } catch (error) {
      console.warn('無法解析設定，使用預設時區');
    }
  }
  return 'Asia/Taipei';
};

// 將日期轉換為指定時區的日期
export const convertToTimezone = (date: Date, timezone: string = getCurrentTimezone()): Date => {
  try {
    // 創建一個新的日期對象，使用指定時區
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc);
    
    // 使用 Intl.DateTimeFormat 來處理時區轉換
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(targetTime);
    const values: { [key: string]: string } = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });
    
    // 構建新的日期字符串
    const dateString = `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
    return new Date(dateString);
  } catch (error) {
    console.warn('時區轉換失敗，返回原始日期:', error);
    return date;
  }
};

// 將日期轉換為指定時區的 YYYY-MM-DD 格式
export const formatDateToTimezone = (date: Date, timezone: string = getCurrentTimezone()): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch (error) {
    console.warn('時區日期格式化失敗，使用本地格式:', error);
    return date.toISOString().split('T')[0];
  }
};

// 將日期轉換為指定時區的本地化字符串
export const formatDateLocalToTimezone = (date: Date, timezone: string = getCurrentTimezone()): string => {
  try {
    const formatter = new Intl.DateTimeFormat('zh-TW', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(date);
  } catch (error) {
    console.warn('時區本地化日期格式化失敗，使用本地格式:', error);
    return date.toLocaleDateString('zh-TW');
  }
};

// 獲取指定時區的當前時間
export const getCurrentTimeInTimezone = (timezone: string = getCurrentTimezone()): Date => {
  return convertToTimezone(new Date(), timezone);
};

// 檢查兩個日期是否在同一天（考慮時區）
export const isSameDayInTimezone = (date1: Date, date2: Date, timezone: string = getCurrentTimezone()): boolean => {
  const date1Str = formatDateToTimezone(date1, timezone);
  const date2Str = formatDateToTimezone(date2, timezone);
  return date1Str === date2Str;
};

// 獲取指定時區的今天日期
export const getTodayInTimezone = (timezone: string = getCurrentTimezone()): Date => {
  const today = getCurrentTimeInTimezone(timezone);
  today.setHours(0, 0, 0, 0);
  return today;
};

// 將字符串日期轉換為指定時區的 Date 對象
export const parseDateInTimezone = (dateString: string, timezone: string = getCurrentTimezone()): Date => {
  try {
    // 如果是 YYYY-MM-DD 格式
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return convertToTimezone(date, timezone);
    }
    
    // 如果是其他格式，嘗試直接解析
    const date = new Date(dateString);
    return convertToTimezone(date, timezone);
  } catch (error) {
    console.warn('日期解析失敗，返回當前時間:', error);
    return getCurrentTimeInTimezone(timezone);
  }
}; 