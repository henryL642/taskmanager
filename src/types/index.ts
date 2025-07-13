// 任務狀態枚舉
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

// 番茄鐘記錄狀態
export type PomodoroStatus = 'active' | 'completed' | 'paused';

// 專案標籤類型
export type ProjectType = 'quarterly' | 'yearly' | 'custom';

// 專案狀態
export type ProjectStatus = 'active' | 'completed' | 'archived';

// 子任務數據模型
export interface SubTask {
  id: string;                    // 子任務唯一標識
  parentTaskId: string;          // 父任務ID
  name: string;                  // 子任務名稱
  shortName: string;             // 子任務簡稱
  description?: string;          // 子任務描述
  scheduledDate: string | Date;  // 排程日期（本地YYYY-MM-DD字串或Date物件）
  pomodoros: number;             // 這個子任務需要的番茄鐘數
  completedPomodoros: number;    // 已完成的番茄鐘數
  status: TaskStatus;            // 子任務狀態
  createdAt: Date;               // 創建時間
  updatedAt: Date;               // 更新時間
  color?: string;                // 顏色標識（繼承自父任務）
  priority?: 'low' | 'medium' | 'high'; // 優先級（繼承自父任務）
}

// 專案標籤數據模型
export interface ProjectTag {
  id: string;                    // 專案標籤唯一標識
  name: string;                  // 專案名稱
  description?: string;          // 專案描述（可選）
  type: ProjectType;             // 專案類型（季度/年度/自定義）
  startDate: Date;               // 開始日期
  endDate: Date;                 // 結束日期
  color: string;                 // 專案顏色標識
  priority: 'low' | 'medium' | 'high'; // 專案優先級
  status: ProjectStatus;         // 專案狀態
  createdAt: Date;               // 創建時間
  updatedAt: Date;               // 更新時間
}

// 任務數據模型
export interface Task {
  id: string;                    // 任務唯一標識
  name: string;                  // 任務名稱
  shortName: string;             // 任務簡稱（最多2個中文字）
  description?: string;          // 任務描述（可選）
  startDate: Date;               // 開始日期
  deadline: Date;                // 截止日期
  totalPomodoros: number;        // 總番茄鐘數
  completedPomodoros: number;    // 已完成番茄鐘數
  isDaily: boolean;              // 是否為每日固定任務
  dailyPomodoros?: number;       // 每日番茄鐘數（僅用於每日任務）
  status: TaskStatus;            // 任務狀態
  createdAt: Date;               // 創建時間
  updatedAt: Date;               // 更新時間
  color?: string;                // 任務顏色標識（可選）
  priority?: 'low' | 'medium' | 'high'; // 任務優先級
  projectTagId?: string;         // 專案標籤ID（可選）
  subTasks?: SubTask[];          // 子任務列表（可選）
  autoSplit: boolean;            // 是否自動分解成子任務
}

// 番茄鐘記錄
export interface PomodoroRecord {
  id: string;                    // 記錄唯一標識
  taskId: string;                // 關聯的任務ID
  startTime: Date;               // 開始時間
  endTime?: Date;                // 結束時間（可選）
  duration: number;              // 持續時間（分鐘）
  status: PomodoroStatus;        // 記錄狀態
  notes?: string;                // 備註（可選）
}

// 每日統計數據
export interface DailyStats {
  date: string;                  // 日期（YYYY-MM-DD格式）
  totalPomodoros: number;        // 當日總番茄鐘數
  completedTasks: number;        // 完成任務數
  focusTime: number;             // 專注時間（分鐘）
}

// 月度統計數據
export interface MonthlyStats {
  year: number;                  // 年份
  month: number;                 // 月份
  totalPomodoros: number;        // 月度總番茄鐘數
  totalTasks: number;            // 月度總任務數
  completedTasks: number;        // 月度完成任務數
  averageDailyPomodoros: number; // 平均每日番茄鐘數
}

// 圖表數據類型
export interface ChartData {
  labels: string[];              // 標籤數組
  datasets: {
    label: string;               // 數據集標籤
    data: number[];              // 數據數組
    backgroundColor?: string;    // 背景顏色
    borderColor?: string;        // 邊框顏色
    borderWidth?: number;        // 邊框寬度
  }[];
}

// 應用設置
export interface AppSettings {
  pomodoroDuration: number;      // 番茄鐘時長（分鐘）
  shortBreakDuration: number;    // 短休息時長（分鐘）
  longBreakDuration: number;     // 長休息時長（分鐘）
  autoStartBreaks: boolean;      // 自動開始休息
  autoStartPomodoros: boolean;   // 自動開始下一個番茄鐘
  notifications: boolean;        // 啟用通知
  soundEnabled: boolean;         // 啟用聲音
  timezone: string;              // 時區設定（預設：Asia/Taipei）
}

// 過濾器選項
export interface TaskFilter {
  status?: TaskStatus;           // 按狀態過濾
  priority?: 'low' | 'medium' | 'high'; // 按優先級過濾
  isDaily?: boolean;             // 按任務類型過濾
  dateRange?: {                  // 按日期範圍過濾
    start: Date;
    end: Date;
  };
}

// 排序選項
export interface TaskSort {
  field: 'name' | 'deadline' | 'priority' | 'createdAt' | 'status' | 'projectTag';
  direction: 'asc' | 'desc';
}

// 本地存儲鍵名
export const STORAGE_KEYS = {
  TASKS: 'tomato-timer-tasks',
  SUB_TASKS: 'tomato-timer-sub-tasks',
  POMODORO_RECORDS: 'tomato-timer-pomodoro-records',
  PROJECT_TAGS: 'tomato-timer-project-tags',
  SETTINGS: 'tomato-timer-settings',
  DAILY_STATS: 'tomato-timer-daily-stats',
  MONTHLY_STATS: 'tomato-timer-monthly-stats',
} as const; 