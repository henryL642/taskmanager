import { Task, SubTask, PomodoroRecord, ProjectTag, AppSettings, DailyStats, MonthlyStats, STORAGE_KEYS } from '../types';

/**
 * 本地存儲工具類
 * 提供統一的數據存儲和讀取接口，包含資料安全保護機制
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

// 資料版本控制
const DATA_VERSION = '1.0.0';
const BACKUP_PREFIX = 'tomato_timer_backup_';
const MAX_BACKUPS = 5; // 保留最近5個備份

/**
 * 資料安全工具
 */
export const dataSecurity = {
  // 生成資料哈希值用於驗證
  generateHash: (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為32位整數
    }
    return hash.toString();
  },

  // 驗證資料完整性
  validateData: (data: any): boolean => {
    try {
      // 基本結構驗證
      if (!data || typeof data !== 'object') return false;
      
      // 檢查必要欄位
      const requiredFields = ['tasks', 'pomodoroRecords', 'settings'];
      for (const field of requiredFields) {
        if (!(field in data)) return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  // 自動備份資料
  autoBackup: (): void => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      const currentData = {
        tasks: taskStorage.getAll(),
        subTasks: subTaskStorage.getAll(),
        pomodoroRecords: pomodoroStorage.getAll(),
        settings: settingsStorage.get(),
        dailyStats: statsStorage.getDailyStats(),
        monthlyStats: statsStorage.getMonthlyStats(),
        version: DATA_VERSION,
        backupDate: new Date().toISOString(),
      };

      const backupKey = `${BACKUP_PREFIX}${Date.now()}`;
      const backupData = {
        ...currentData,
        hash: dataSecurity.generateHash(JSON.stringify(currentData)),
      };

      localStorage.setItem(backupKey, safeJsonStringify(backupData));
      
      // 清理舊備份，只保留最近5個
      dataSecurity.cleanupOldBackups();
      
      console.log('自動備份完成:', backupKey);
    } catch (error) {
      console.error('自動備份失敗:', error);
    }
  },

  // 清理舊備份
  cleanupOldBackups: (): void => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      const backupKeys: string[] = [];
      
      // 收集所有備份鍵
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_PREFIX)) {
          backupKeys.push(key);
        }
      }
      
      // 按時間排序並刪除舊備份
      backupKeys.sort().reverse();
      
      for (let i = MAX_BACKUPS; i < backupKeys.length; i++) {
        localStorage.removeItem(backupKeys[i]);
      }
    } catch (error) {
      console.error('清理舊備份失敗:', error);
    }
  },

  // 恢復最新備份
  restoreLatestBackup: (): boolean => {
    if (!isLocalStorageAvailable()) return false;
    
    try {
      const backupKeys: string[] = [];
      
      // 收集所有備份鍵
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_PREFIX)) {
          backupKeys.push(key);
        }
      }
      
      if (backupKeys.length === 0) return false;
      
      // 獲取最新的備份
      backupKeys.sort().reverse();
      const latestBackupKey = backupKeys[0];
      const backupData = localStorage.getItem(latestBackupKey);
      
      if (!backupData) return false;
      
      const parsedBackup = safeJsonParse(backupData, null);
      if (!parsedBackup || !dataSecurity.validateData(parsedBackup)) return false;
      
      // 驗證哈希值
      const { hash, ...data } = parsedBackup as any;
      const expectedHash = dataSecurity.generateHash(JSON.stringify(data));
      
      if (hash !== expectedHash) {
        console.error('備份資料完整性驗證失敗');
        return false;
      }
      
      // 恢復資料
      if (data.tasks) taskStorage.saveAll(data.tasks);
      if (data.subTasks) subTaskStorage.saveAll(data.subTasks);
      if (data.pomodoroRecords) pomodoroStorage.saveAll(data.pomodoroRecords);
      if (data.settings) settingsStorage.save(data.settings);
      if (data.dailyStats) statsStorage.saveDailyStats(data.dailyStats);
      if (data.monthlyStats) statsStorage.saveMonthlyStats(data.monthlyStats);
      
      console.log('備份恢復成功:', latestBackupKey);
      return true;
    } catch (error) {
      console.error('備份恢復失敗:', error);
      return false;
    }
  },

  // 獲取所有備份列表
  getBackupList: (): Array<{key: string, date: string, size: number}> => {
    if (!isLocalStorageAvailable()) return [];
    
    const backups: Array<{key: string, date: string, size: number}> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = safeJsonParse(data, null);
            backups.push({
              key,
              date: (parsed as any)?.backupDate || '未知',
              size: data.length,
            });
          }
        }
      }
      
      return backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('獲取備份列表失敗:', error);
      return [];
    }
  },

  // 檢查資料健康狀況
  checkDataHealth: (): {isHealthy: boolean, issues: string[]} => {
    const issues: string[] = [];
    
    try {
      // 檢查基本資料結構
      const tasks = taskStorage.getAll();
      const subTasks = subTaskStorage.getAll();
      const records = pomodoroStorage.getAll();
      // const settings = settingsStorage.get(); // 暫時未使用
      
      // 檢查任務資料完整性
      for (const task of tasks) {
        if (!task.id || !task.name) {
          issues.push(`任務資料不完整: ${task.id || '未知ID'}`);
        }
      }
      
      // 檢查子任務與父任務的關聯
      for (const subTask of subTasks) {
        const parentTask = tasks.find(t => t.id === subTask.parentTaskId);
        if (!parentTask) {
          issues.push(`子任務 ${subTask.id} 的父任務不存在: ${subTask.parentTaskId}`);
        }
      }
      
      // 檢查番茄鐘記錄與任務的關聯
      for (const record of records) {
        const task = tasks.find(t => t.id === record.taskId);
        const subTask = subTasks.find(s => s.id === record.taskId);
        if (!task && !subTask) {
          issues.push(`番茄鐘記錄 ${record.id} 的任務不存在: ${record.taskId}`);
        }
      }
      
      return {
        isHealthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(`資料健康檢查失敗: ${error}`);
      return {
        isHealthy: false,
        issues,
      };
    }
  },

  // 修復資料問題
  repairData: (): {repaired: boolean, message: string} => {
    try {
      const tasks = taskStorage.getAll();
      const subTasks = subTaskStorage.getAll();
      const records = pomodoroStorage.getAll();
      
      let repairedCount = 0;
      const taskIds = new Set(tasks.map(t => t.id));
      const subTaskIds = new Set(subTasks.map(s => s.id));
      const validTaskIds = new Set([...taskIds, ...subTaskIds]);
      
      // 修復孤立的番茄鐘記錄
      const validRecords = records.filter(record => {
        if (!validTaskIds.has(record.taskId)) {
          console.log(`移除孤立的番茄鐘記錄: ${record.id} (任務: ${record.taskId})`);
          repairedCount++;
          return false;
        }
        return true;
      });
      
      // 修復孤立的子任務
      const validSubTasks = subTasks.filter(subTask => {
        if (!taskIds.has(subTask.parentTaskId)) {
          console.log(`移除孤立的子任務: ${subTask.id} (父任務: ${subTask.parentTaskId})`);
          repairedCount++;
          return false;
        }
        return true;
      });
      
      // 保存修復後的資料
      if (repairedCount > 0) {
        pomodoroStorage.saveAll(validRecords);
        subTaskStorage.saveAll(validSubTasks);
        
        // 創建修復備份
        dataSecurity.autoBackup();
        
        return {
          repaired: true,
          message: `成功修復 ${repairedCount} 個資料問題`
        };
      }
      
      return {
        repaired: false,
        message: '沒有發現需要修復的資料問題'
      };
    } catch (error) {
      return {
        repaired: false,
        message: `資料修復失敗: ${error}`
      };
    }
  },
};

/**
 * 專案標籤數據存儲
 */
export const projectTagStorage = {
  // 獲取所有專案標籤
  getAll: (): ProjectTag[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const data = localStorage.getItem(STORAGE_KEYS.PROJECT_TAGS);
    const projectTags = safeJsonParse<ProjectTag[]>(data || '[]', []);
    
    // 將字符串日期轉換回 Date 對象
    return projectTags.map(projectTag => ({
      ...projectTag,
      startDate: new Date(projectTag.startDate),
      endDate: new Date(projectTag.endDate),
      createdAt: new Date(projectTag.createdAt),
      updatedAt: new Date(projectTag.updatedAt),
    }));
  },

  // 保存所有專案標籤
  saveAll: (projectTags: ProjectTag[]): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.PROJECT_TAGS, safeJsonStringify(projectTags));
    // 自動備份
    dataSecurity.autoBackup();
  },

  // 添加新專案標籤
  add: (projectTag: ProjectTag): void => {
    const projectTags = projectTagStorage.getAll();
    projectTags.push(projectTag);
    projectTagStorage.saveAll(projectTags);
  },

  // 更新專案標籤
  update: (updatedProjectTag: ProjectTag): void => {
    const projectTags = projectTagStorage.getAll();
    const index = projectTags.findIndex(projectTag => projectTag.id === updatedProjectTag.id);
    if (index !== -1) {
      projectTags[index] = updatedProjectTag;
      projectTagStorage.saveAll(projectTags);
    }
  },

  // 刪除專案標籤
  delete: (projectTagId: string): void => {
    const projectTags = projectTagStorage.getAll();
    const filteredProjectTags = projectTags.filter(projectTag => projectTag.id !== projectTagId);
    projectTagStorage.saveAll(filteredProjectTags);
  },

  // 根據ID獲取專案標籤
  getById: (projectTagId: string): ProjectTag | undefined => {
    const projectTags = projectTagStorage.getAll();
    return projectTags.find(projectTag => projectTag.id === projectTagId);
  },

  // 獲取活躍的專案標籤
  getActive: (): ProjectTag[] => {
    const projectTags = projectTagStorage.getAll();
    return projectTags.filter(projectTag => projectTag.status === 'active');
  },

  // 根據類型獲取專案標籤
  getByType: (type: 'quarterly' | 'yearly' | 'custom'): ProjectTag[] => {
    const projectTags = projectTagStorage.getAll();
    return projectTags.filter(projectTag => projectTag.type === type);
  },
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
    // 自動備份
    dataSecurity.autoBackup();
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
    // 自動備份
    dataSecurity.autoBackup();
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
    // 自動備份
    dataSecurity.autoBackup();
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
    timezone: 'Asia/Taipei',     // 預設台北時區
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