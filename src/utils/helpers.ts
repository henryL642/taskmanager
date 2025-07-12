import { Task, SubTask, PomodoroRecord, DailyStats } from '../types';

/**
 * 通用工具函數集合
 */

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 將大任務分解成子任務
export const splitTaskIntoSubTasks = (task: Task): SubTask[] => {
  const subTasks: SubTask[] = [];
  
  // 如果是每日任務，為每一天自動產生一個可編輯的子任務
  if (task.isDaily) {
    const startDate = new Date(task.startDate);
    const deadline = new Date(task.deadline);
    const daysDiff = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyPomodoros = task.dailyPomodoros && task.dailyPomodoros > 0 ? task.dailyPomodoros : 1; // 預設為1
    const debugSubTasks = [];
    for (let i = 0; i < daysDiff; i++) {
      const scheduledDateObj = new Date(startDate);
      scheduledDateObj.setDate(startDate.getDate() + i);
      // 生成 YYYY-MM-DD 字串
      const scheduledDate = formatDate(scheduledDateObj);
      // 生成子任務名稱：主任務名稱-0710
      const month = (scheduledDateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = scheduledDateObj.getDate().toString().padStart(2, '0');
      const subTask: SubTask = {
        id: generateId(),
        parentTaskId: task.id,
        name: `${task.name}-${month}${day}`,
        shortName: `${task.shortName}-${month}${day}`,
        description: task.description,
        scheduledDate: scheduledDate, // 存 YYYY-MM-DD
        pomodoros: dailyPomodoros,
        completedPomodoros: 0,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        color: task.color,
        priority: task.priority,
      };
      subTasks.push(subTask);
      debugSubTasks.push(subTask);
    }
    // DEBUG: 輸出自動產生的每日子任務
    console.log('splitTaskIntoSubTasks 產生的每日子任務', debugSubTasks);
    return subTasks;
  }
  
  // 非每日任務的自動分解（原本邏輯）
  
  // 計算任務持續天數
  const startDate = new Date(task.startDate);
  const deadline = new Date(task.deadline);
  const daysDiff = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // 計算每天應該完成的番茄鐘數
  const pomodorosPerDay = Math.ceil(task.totalPomodoros / daysDiff);
  
  let remainingPomodoros = task.totalPomodoros;
  
  for (let i = 0; i < daysDiff; i++) {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(startDate.getDate() + i);
    
    // 計算當天應該完成的番茄鐘數
    const dayPomodoros = Math.min(pomodorosPerDay, remainingPomodoros);
    
    if (dayPomodoros > 0) {
      const subTask: SubTask = {
        id: generateId(),
        parentTaskId: task.id,
        name: `${task.name} - 第${i + 1}天`,
        shortName: `${task.shortName}-${i + 1}`,
        description: task.description,
        scheduledDate: scheduledDate,
        pomodoros: dayPomodoros,
        completedPomodoros: 0,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        color: task.color,
        priority: task.priority,
      };
      
      subTasks.push(subTask);
      remainingPomodoros -= dayPomodoros;
    }
  }
  
  return subTasks;
};

// 檢查子任務是否為當日任務
export const isTodaySubTask = (subTask: SubTask): boolean => {
  const today = new Date();
  const scheduledDate = new Date(subTask.scheduledDate);
  
  // 重置時間部分，只比較日期
  today.setHours(0, 0, 0, 0);
  scheduledDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === scheduledDate.getTime() && subTask.status !== 'completed';
};

// 獲取指定日期的子任務
export const getSubTasksForDate = (subTasks: SubTask[], date: Date): SubTask[] => {
  const y1 = date.getFullYear();
  const m1 = date.getMonth() + 1;
  const d1 = date.getDate();
  return subTasks.filter(subTask => {
    let y2, m2, d2;
    if (typeof subTask.scheduledDate === 'string') {
      const [yy, mm, dd] = subTask.scheduledDate.split('-').map(Number);
      y2 = yy;
      m2 = mm;
      d2 = dd;
    } else {
      const dt = subTask.scheduledDate as Date;
      y2 = dt.getFullYear();
      m2 = dt.getMonth() + 1;
      d2 = dt.getDate();
    }
    return y1 === y2 && m1 === m2 && d1 === d2 && subTask.status !== 'completed';
  });
};

// 計算子任務進度百分比
export const calculateSubTaskProgress = (subTask: SubTask): number => {
  if (subTask.pomodoros === 0) return 0;
  return Math.round((subTask.completedPomodoros / subTask.pomodoros) * 100);
};

// 格式化時間為 MM:SS 格式
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 格式化日期為 YYYY-MM-DD 格式
export const formatDate = (date: Date): string => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

// 格式化日期為本地化字符串
export const formatDateLocal = (date: Date): string => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '無效日期';
  }
  
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 格式化時間為本地化字符串
export const formatTimeLocal = (date: Date): string => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '00:00';
  }
  
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 計算兩個日期之間的天數差
export const daysBetween = (date1: Date, date2: Date): number => {
  // 檢查日期是否有效
  if (!date1 || !(date1 instanceof Date) || isNaN(date1.getTime()) ||
      !date2 || !(date2 instanceof Date) || isNaN(date2.getTime())) {
    return 0;
  }
  
  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒數
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

// 檢查日期是否為今天
export const isToday = (date: Date): boolean => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  
  // 重置時間部分，只比較日期
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);
  
  return dateOnly.getTime() === todayOnly.getTime();
};

// 檢查日期是否為昨天
export const isYesterday = (date: Date): boolean => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 重置時間部分，只比較日期
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const yesterdayOnly = new Date(yesterday);
  yesterdayOnly.setHours(0, 0, 0, 0);
  
  return dateOnly.getTime() === yesterdayOnly.getTime();
};

// 獲取日期的開始時間（00:00:00）
export const getStartOfDay = (date: Date): Date => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// 獲取日期的結束時間（23:59:59）
export const getEndOfDay = (date: Date): Date => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

// 獲取當月的第一天
export const getFirstDayOfMonth = (date: Date): Date => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// 獲取當月的最後一天
export const getLastDayOfMonth = (date: Date): Date => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// 獲取當月的所有日期
export const getDaysInMonth = (date: Date): Date[] => {
  const days: Date[] = [];
  const firstDay = getFirstDayOfMonth(date);
  const lastDay = getLastDayOfMonth(date);
  
  // 添加上個月的日期（填充週曆）
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(firstDay);
    prevDate.setDate(prevDate.getDate() - i - 1);
    days.push(prevDate);
  }
  
  // 添加當月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), i));
  }
  
  // 添加下個月的日期（填充週曆）
  const lastDayOfWeek = lastDay.getDay();
  for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
    const nextDate = new Date(lastDay);
    nextDate.setDate(nextDate.getDate() + i);
    days.push(nextDate);
  }
  
  return days;
};

// 計算任務進度百分比
export const calculateTaskProgress = (task: Task): number => {
  if (task.totalPomodoros === 0) return 0;
  return Math.round((task.completedPomodoros / task.totalPomodoros) * 100);
};

// 計算任務剩餘番茄鐘數
export const getRemainingPomodoros = (task: Task): number => {
  return Math.max(0, task.totalPomodoros - task.completedPomodoros);
};

// 檢查任務是否已過期
export const isTaskOverdue = (task: Task): boolean => {
  // 檢查截止日期是否有效
  if (!task.deadline || !(task.deadline instanceof Date) || isNaN(task.deadline.getTime())) {
    return false;
  }
  
  return new Date() > task.deadline && task.status !== 'completed';
};

// 計算任務的緊急程度（基於截止日期）
export const calculateTaskUrgency = (task: Task): number => {
  if (task.status === 'completed') return 0;
  
  // 檢查截止日期是否有效
  if (!task.deadline || !(task.deadline instanceof Date) || isNaN(task.deadline.getTime())) {
    return 10; // 默認低緊急程度
  }
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const daysUntilDeadline = daysBetween(now, deadline);
  
  if (daysUntilDeadline < 0) return 100; // 已過期
  if (daysUntilDeadline === 0) return 90; // 今天到期
  if (daysUntilDeadline <= 3) return 80; // 3天內到期
  if (daysUntilDeadline <= 7) return 60; // 一週內到期
  if (daysUntilDeadline <= 14) return 40; // 兩週內到期
  if (daysUntilDeadline <= 30) return 20; // 一個月內到期
  
  return 10; // 超過一個月
};

// 根據緊急程度獲取顏色
export const getUrgencyColor = (urgency: number): string => {
  if (urgency >= 80) return 'text-red-600';
  if (urgency >= 60) return 'text-orange-600';
  if (urgency >= 40) return 'text-yellow-600';
  if (urgency >= 20) return 'text-blue-600';
  return 'text-green-600';
};

// 計算指定日期的番茄鐘總數
export const getPomodorosForDate = (records: PomodoroRecord[], date: Date): number => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 0;
  }
  const y1 = date.getFullYear();
  const m1 = date.getMonth() + 1;
  const d1 = date.getDate();
  return records.filter(record => {
    if (!record.startTime) return false;
    let y2, m2, d2;
    let dt;
    if (typeof record.startTime === 'string') {
      dt = new Date(record.startTime);
    } else {
      dt = record.startTime;
    }
    y2 = dt.getFullYear();
    m2 = dt.getMonth() + 1;
    d2 = dt.getDate();
    return y1 === y2 && m1 === m2 && d1 === d2 && record.status === 'completed';
  }).length;
};

// 計算指定日期的專注時間（分鐘）
export const getFocusTimeForDate = (records: PomodoroRecord[], date: Date): number => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 0;
  }
  
  const dateStr = formatDate(date);
  return records
    .filter(record => {
      // 檢查記錄的開始時間是否有效
      if (!record.startTime || !(record.startTime instanceof Date) || isNaN(record.startTime.getTime())) {
        return false;
      }
      
      const recordDate = formatDate(record.startTime);
      return recordDate === dateStr && record.status === 'completed';
    })
    .reduce((total, record) => total + record.duration, 0);
};

// 生成每日統計數據
export const generateDailyStats = (records: PomodoroRecord[], date: Date): DailyStats => {
  // 檢查日期是否有效
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return {
      date: '',
      totalPomodoros: 0,
      completedTasks: 0,
      focusTime: 0,
    };
  }
  
  const dateStr = formatDate(date);
  const dayRecords = records.filter(record => {
    // 檢查記錄的開始時間是否有效
    if (!record.startTime || !(record.startTime instanceof Date) || isNaN(record.startTime.getTime())) {
      return false;
    }
    
    const recordDate = formatDate(record.startTime);
    return recordDate === dateStr && record.status === 'completed';
  });
  
  return {
    date: dateStr,
    totalPomodoros: dayRecords.length,
    completedTasks: new Set(dayRecords.map(r => r.taskId)).size,
    focusTime: dayRecords.reduce((total, record) => total + record.duration, 0),
  };
};

// 獲取任務狀態的顯示文本
export const getTaskStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待處理';
    case 'in-progress': return '進行中';
    case 'completed': return '已完成';
    default: return '未知';
  }
};

// 獲取任務優先級的顯示文本
export const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'low': return '低';
    case 'medium': return '中';
    case 'high': return '高';
    default: return '未設定';
  }
};

// 獲取任務優先級的顏色
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// 深拷貝對象
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// 防抖函數
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 節流函數
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}; 