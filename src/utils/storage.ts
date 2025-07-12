import { Task, SubTask, PomodoroRecord, AppSettings, DailyStats, MonthlyStats, STORAGE_KEYS } from '../types';

/**
 * 本地存儲工具類
 * 提供統一的數據存儲和讀取接口
 */

// 檢查瀏覽器是否支持 localStorage
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// 安全的 JSON 解析
const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

// 安全的 JSON 序列化
const safeJsonStringify = (value: any): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
};

/**
 * 任務數據存儲
 */
export const taskStorage = {
  // 獲取所有任務
  getAll: (): Task[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks = safeJsonParse<Task[]>(data || '[]', []);
    
    // 將字符串日期轉換回 Date 對象
    return tasks.map(task => ({
      ...task,
      startDate: new Date(task.startDate),
      deadline: new Date(task.deadline),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));
  },

  // 保存所有任務
  saveAll: (tasks: Task[]): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.TASKS, safeJsonStringify(tasks));
  },

  // 添加新任務
  add: (task: Task): void => {
    const tasks = taskStorage.getAll();
    tasks.push(task);
    taskStorage.saveAll(tasks);
  },

  // 更新任務
  update: (updatedTask: Task): void => {
    const tasks = taskStorage.getAll();
    const index = tasks.findIndex(task => task.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      taskStorage.saveAll(tasks);
    }
  },

  // 刪除任務
  delete: (taskId: string): void => {
    const tasks = taskStorage.getAll();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    taskStorage.saveAll(filteredTasks);
  },

  // 根據ID獲取任務
  getById: (taskId: string): Task | undefined => {
    const tasks = taskStorage.getAll();
    return tasks.find(task => task.id === taskId);
  },
};

/**
 * 子任務數據存儲
 */
export const subTaskStorage = {
  // 獲取所有子任務
  getAll: (): SubTask[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const data = localStorage.getItem(STORAGE_KEYS.SUB_TASKS);
    const subTasks = safeJsonParse<SubTask[]>(data || '[]', []);
    
    // 將字符串日期轉換回 Date 對象
    return subTasks.map(subTask => ({
      ...subTask,
      scheduledDate: new Date(subTask.scheduledDate),
      createdAt: new Date(subTask.createdAt),
      updatedAt: new Date(subTask.updatedAt),
    }));
  },

  // 保存所有子任務
  saveAll: (subTasks: SubTask[]): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.SUB_TASKS, safeJsonStringify(subTasks));
  },

  // 添加新子任務
  add: (subTask: SubTask): void => {
    const subTasks = subTaskStorage.getAll();
    subTasks.push(subTask);
    subTaskStorage.saveAll(subTasks);
  },

  // 更新子任務
  update: (updatedSubTask: SubTask): void => {
    const subTasks = subTaskStorage.getAll();
    const index = subTasks.findIndex(subTask => subTask.id === updatedSubTask.id);
    if (index !== -1) {
      subTasks[index] = updatedSubTask;
      subTaskStorage.saveAll(subTasks);
    }
  },

  // 刪除子任務
  delete: (subTaskId: string): void => {
    const subTasks = subTaskStorage.getAll();
    const filteredSubTasks = subTasks.filter(subTask => subTask.id !== subTaskId);
    subTaskStorage.saveAll(filteredSubTasks);
  },

  // 根據父任務ID獲取子任務
  getByParentTaskId: (parentTaskId: string): SubTask[] => {
    const subTasks = subTaskStorage.getAll();
    return subTasks.filter(subTask => subTask.parentTaskId === parentTaskId);
  },

  // 根據ID獲取子任務
  getById: (subTaskId: string): SubTask | undefined => {
    const subTasks = subTaskStorage.getAll();
    return subTasks.find(subTask => subTask.id === subTaskId);
  },

  // 刪除父任務的所有子任務
  deleteByParentTaskId: (parentTaskId: string): void => {
    const subTasks = subTaskStorage.getAll();
    const filteredSubTasks = subTasks.filter(subTask => subTask.parentTaskId !== parentTaskId);
    subTaskStorage.saveAll(filteredSubTasks);
  },
};

/**
 * 番茄鐘記錄存儲
 */
export const pomodoroStorage = {
  // 獲取所有番茄鐘記錄
  getAll: (): PomodoroRecord[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const data = localStorage.getItem(STORAGE_KEYS.POMODORO_RECORDS);
    const records = safeJsonParse<PomodoroRecord[]>(data || '[]', []);
    
    // 將字符串日期轉換回 Date 對象
    return records.map(record => ({
      ...record,
      startTime: new Date(record.startTime),
      endTime: record.endTime ? new Date(record.endTime) : undefined,
    }));
  },

  // 保存所有番茄鐘記錄
  saveAll: (records: PomodoroRecord[]): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.POMODORO_RECORDS, safeJsonStringify(records));
  },

  // 添加新記錄
  add: (record: PomodoroRecord): void => {
    const records = pomodoroStorage.getAll();
    records.push(record);
    pomodoroStorage.saveAll(records);
  },

  // 更新記錄
  update: (updatedRecord: PomodoroRecord): void => {
    const records = pomodoroStorage.getAll();
    const index = records.findIndex(record => record.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = updatedRecord;
      pomodoroStorage.saveAll(records);
    }
  },

  // 根據任務ID獲取記錄
  getByTaskId: (taskId: string): PomodoroRecord[] => {
    const records = pomodoroStorage.getAll();
    return records.filter(record => record.taskId === taskId);
  },

  // 根據日期獲取記錄
  getByDate: (date: Date): PomodoroRecord[] => {
    const records = pomodoroStorage.getAll();
    const dateStr = date.toISOString().split('T')[0];
    return records.filter(record => {
      const recordDate = record.startTime.toISOString().split('T')[0];
      return recordDate === dateStr;
    });
  },
};

/**
 * 應用設置存儲
 */
export const settingsStorage = {
  // 默認設置
  defaultSettings: (): AppSettings => ({
    pomodoroDuration: 40,        // 40分鐘番茄鐘
    shortBreakDuration: 5,       // 5分鐘短休息
    longBreakDuration: 15,       // 15分鐘長休息
    autoStartBreaks: false,      // 不自動開始休息
    autoStartPomodoros: false,   // 不自動開始下一個番茄鐘
    notifications: true,         // 啟用通知
    soundEnabled: true,          // 啟用聲音
  }),

  // 獲取設置
  get: (): AppSettings => {
    if (!isLocalStorageAvailable()) return settingsStorage.defaultSettings();
    
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedSettings = safeJsonParse<Partial<AppSettings>>(data || '{}', {});
    
    return {
      ...settingsStorage.defaultSettings(),
      ...savedSettings,
    };
  },

  // 保存設置
  save: (settings: AppSettings): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, safeJsonStringify(settings));
  },

  // 更新部分設置
  update: (partialSettings: Partial<AppSettings>): void => {
    const currentSettings = settingsStorage.get();
    const newSettings = { ...currentSettings, ...partialSettings };
    settingsStorage.save(newSettings);
  },
};

/**
 * 統計數據存儲
 */
export const statsStorage = {
  // 獲取每日統計
  getDailyStats: (): DailyStats[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
    return safeJsonParse<DailyStats[]>(data || '[]', []);
  },

  // 保存每日統計
  saveDailyStats: (stats: DailyStats[]): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, safeJsonStringify(stats));
  },

  // 獲取月度統計
  getMonthlyStats: (): MonthlyStats[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_STATS);
    return safeJsonParse<MonthlyStats[]>(data || '[]', []);
  },

  // 保存月度統計
  saveMonthlyStats: (stats: MonthlyStats[]): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.MONTHLY_STATS, safeJsonStringify(stats));
  },
};

/**
 * 數據導出功能
 */
export const exportData = (): string => {
  const data = {
    tasks: taskStorage.getAll(),
    pomodoroRecords: pomodoroStorage.getAll(),
    settings: settingsStorage.get(),
    dailyStats: statsStorage.getDailyStats(),
    monthlyStats: statsStorage.getMonthlyStats(),
    exportDate: new Date().toISOString(),
  };
  
  return safeJsonStringify(data);
};

/**
 * 數據導入功能
 */
export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.tasks) taskStorage.saveAll(data.tasks);
    if (data.pomodoroRecords) pomodoroStorage.saveAll(data.pomodoroRecords);
    if (data.settings) settingsStorage.save(data.settings);
    if (data.dailyStats) statsStorage.saveDailyStats(data.dailyStats);
    if (data.monthlyStats) statsStorage.saveMonthlyStats(data.monthlyStats);
    
    return true;
  } catch {
    return false;
  }
};

/**
 * 清除所有數據
 */
export const clearAllData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}; 