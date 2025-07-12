import React from 'react';
import { Task, SubTask, PomodoroRecord } from '../../types';
import { getDaysInMonth, isToday, getPomodorosForDate, getSubTasksForDate } from '../../utils/helpers';
import CalendarDay from './CalendarDay';

// 臨時子任務類型
interface TempSubTask {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  pomodoros: number;
  completedPomodoros: number;
  status: 'pending' | 'in-progress' | 'completed';
  scheduledDate: string; // YYYY-MM-DD 格式
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarProps {
  currentDate: Date;
  tasks: Task[];
  subTasks: SubTask[];
  tempSubTasks: TempSubTask[];
  pomodoroRecords: PomodoroRecord[];
  onDateChange: (date: Date) => void;
  onTaskSelect: (task: Task | null, subTask?: SubTask | null) => void;
  // onTaskUpdate: (task: Task) => void; // 已移除未使用的 prop
}

/**
 * 月曆組件
 * 顯示月曆視圖，包含任務進度和番茄鐘統計
 */
const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  tasks,
  subTasks,
  tempSubTasks,
  pomodoroRecords,
  onDateChange,
  onTaskSelect,
  // onTaskUpdate, // 已移除未使用的 prop
}) => {
  // 獲取當月的所有日期
  const daysInMonth = getDaysInMonth(currentDate);
  
  // 週幾的標籤
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  // 獲取指定日期的任務
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      // 每日任務 - 檢查是否在有效期間內
      if (task.isDaily) {
        const startDate = new Date(task.startDate);
        const deadline = new Date(task.deadline);
        const currentDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        deadline.setHours(23, 59, 59, 999);
        currentDate.setHours(0, 0, 0, 0);
        // 如果當天有子任務，則不顯示主線任務
        const hasSubTaskToday = subTasks.some(
          st => st.parentTaskId === task.id &&
                new Date(st.scheduledDate).setHours(0,0,0,0) === currentDate.getTime()
        );
        if (hasSubTaskToday) return false;
        return currentDate >= startDate && currentDate <= deadline;
      }
      // 非每日任務：只有當天有子任務屬於該主任務且排程在當天才顯示
      const hasSubTaskToday = subTasks.some(
        st => st.parentTaskId === task.id &&
              new Date(st.scheduledDate).setHours(0,0,0,0) === new Date(date).setHours(0,0,0,0)
      );
      return hasSubTaskToday;
    });
  };

  // 檢查日期是否為當前月份
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  // 獲取指定日期的臨時子任務
  const getTempSubTasksForDate = (tempSubTasks: TempSubTask[], date: Date): TempSubTask[] => {
    // 用本地時區組合 YYYY-MM-DD
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return tempSubTasks.filter(tempSubTask => tempSubTask.scheduledDate === dateStr);
  };

  return (
    <div className="flex flex-col">
      {/* 月曆標題 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </h2>
        <p className="text-gray-600 mt-1">
          專注於你的目標，一個番茄鐘一個番茄鐘地完成任務
        </p>
      </div>

      {/* 月曆網格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* 週幾標題 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map(day => (
            <div
              key={day}
              className="p-4 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期網格 */}
        <div className="grid grid-cols-7">
          {daysInMonth.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const dayPomodoros = getPomodorosForDate(pomodoroRecords, date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);

            // 調試今天日期
            if (isTodayDate) {
              console.log('今天日期調試:', {
                date: date.toISOString().split('T')[0],
                dayNumber: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                isTodayDate
              });
            }

            // 調試7月12日
            if (date.getDate() === 12 && date.getMonth() === 6) { // 7月是第6個月（0-based）
              console.log('7月12日調試:', {
                date: date.toISOString().split('T')[0],
                dayTasks: dayTasks.map(t => ({ name: t.name, shortName: t.shortName })),
                isCurrentMonthDay,
                isTodayDate
              });
            }

            return (
              <CalendarDay
                key={index}
                date={date}
                tasks={dayTasks}
                subTasks={getSubTasksForDate(subTasks, date)}
                tempSubTasks={getTempSubTasksForDate(tempSubTasks, date)}
                pomodoroCount={dayPomodoros}
                isCurrentMonth={isCurrentMonthDay}
                isToday={isTodayDate}
                onDateClick={() => onDateChange(date)}
                onTaskClick={onTaskSelect}
              />
            );
          })}
        </div>
      </div>

      {/* 圖例說明 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">圖例說明</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">子任務完成番茄鐘數</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <span className="text-gray-600">臨時子任務完成番茄鐘數</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <span className="text-gray-600">子任務（左紫邊）</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">已完成</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 rounded-full"></div>
            <span className="text-gray-600">週末</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-gray-600">其他月份</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 