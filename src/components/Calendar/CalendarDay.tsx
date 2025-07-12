import React from 'react';
import { Task, SubTask } from '../../types';
import { calculateTaskProgress, calculateSubTaskProgress } from '../../utils/helpers';

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  subTasks: SubTask[];
  pomodoroCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  onDateClick: () => void;
  onTaskClick: (task: Task | null, subTask?: SubTask | null) => void;
  onTaskUpdate?: (task: Task) => void;
}

/**
 * 日曆單日組件
 * 顯示單個日期的任務和番茄鐘信息
 */
const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  tasks,
  subTasks,
  pomodoroCount,
  isCurrentMonth,
  isToday,
  onDateClick,
  onTaskClick,
  onTaskUpdate,
}) => {
  // 計算當日任務和子任務完成進度
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completedSubTasks = subTasks.filter(subTask => subTask.status === 'completed').length;
  const totalTasks = tasks.length + subTasks.length;
  const completionRate = totalTasks > 0 ? ((completedTasks + completedSubTasks) / totalTasks) * 100 : 0;

  // 獲取日期顯示文本
  const dayNumber = date.getDate();

  // 檢查是否為週末
  const isWeekend = (): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = 週日, 6 = 週六
  };

  // 根據任務狀態獲取背景顏色
  const getDayBackgroundColor = (): string => {
    if (!isCurrentMonth) return 'bg-gray-50';
    if (isToday) return 'bg-tomato-100 border-2 border-tomato-500';
    
    // 週末添加透明紅色底
    const weekendBg = isWeekend() ? 'bg-red-50' : '';
    
    if (totalTasks === 0) return weekendBg || 'bg-white';
    if (completionRate === 100) return 'bg-green-50';
    if (completionRate > 0) return 'bg-blue-50';
    return 'bg-yellow-50';
  };

  // 獲取日期文字顏色
  const getDayTextColor = (): string => {
    if (!isCurrentMonth) return 'text-gray-400';
    if (isToday) return 'text-tomato-700 font-bold';
    return 'text-gray-900';
  };

  return (
    <div
      className={`min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${getDayBackgroundColor()}`}
      onClick={onDateClick}
    >
      {/* 日期數字 */}
      <div className={`text-sm font-medium mb-1 ${getDayTextColor()}`}>
        {dayNumber}
      </div>

      {/* 番茄鐘計數 */}
      {pomodoroCount > 0 && (
        <div className="flex items-center space-x-1 mb-2">
          <div className="w-2 h-2 bg-tomato-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{pomodoroCount}</span>
        </div>
      )}

      {/* 任務和子任務列表 */}
      <div className="space-y-1">
        {/* 顯示任務 */}
        {tasks.map(task => {
          const progress = calculateTaskProgress(task);
          const isCompleted = task.status === 'completed';
          return (
            <div
              key={`task-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task);
              }}
              className={`p-1 rounded text-xs cursor-pointer transition-colors ${
                isCompleted
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : task.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
              title={`${task.name} - ${progress}% 完成`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{task.shortName || task.name.charAt(0)}</span>
                <span className="text-xs ml-1">{progress}%</span>
              </div>
              {/* 進度條 */}
              <div className="w-full bg-white bg-opacity-50 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500'
                      : task.status === 'in-progress'
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {/* 顯示子任務 */}
        {subTasks.map(subTask => {
          const progress = calculateSubTaskProgress(subTask);
          const isCompleted = subTask.status === 'completed';
          return (
            <div
              key={`subtask-${subTask.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(null, subTask);
              }}
              className={`p-1 rounded text-xs cursor-pointer transition-colors border-l-2 border-purple-400 ${
                isCompleted
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : subTask.status === 'in-progress'
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
              title={`${subTask.name} - ${progress}% 完成`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{subTask.shortName}</span>
                <span className="text-xs ml-1">{progress}%</span>
              </div>
              {/* 進度條 */}
              <div className="w-full bg-white bg-opacity-50 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500'
                      : subTask.status === 'in-progress'
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        {/* 更多任務指示器（可移除或保留） */}
        {/* (tasks.length + subTasks.length) > 4 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{(tasks.length + subTasks.length) - 4} 更多
          </div>
        ) */}
      </div>

      {/* 完成率指示器 */}
      {totalTasks > 0 && (
        <div className="absolute bottom-1 right-1">
          <div className="w-4 h-4 rounded-full bg-white border border-gray-300 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {Math.round(completionRate)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDay; 