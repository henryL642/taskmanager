import React from 'react';
import { Task, SubTask } from '../../types';
import { calculateTaskProgress, calculateSubTaskProgress } from '../../utils/helpers';

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

interface CalendarDayProps {
  date: Date; // 當前日期
  tasks: Task[]; // 當天的主任務列表
  subTasks: SubTask[]; // 當天的子任務列表
  tempSubTasks: TempSubTask[]; // 當天的臨時子任務列表
  // pomodoroCount: number; // 已移除未使用的屬性
  isCurrentMonth: boolean; // 是否為當月
  isToday: boolean; // 是否為今天
  onDateClick: () => void; // 點擊日期事件
  onTaskClick: (task: Task | null, subTask?: SubTask | null) => void; // 點擊任務或子任務事件
  // onTaskUpdate?: (task: Task) => void; // 已移除未使用的 prop
}

/**
 * 日曆單日組件
 * 顯示單個日期的任務和番茄鐘信息
 */
const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  tasks,
  subTasks,
  tempSubTasks,
  // pomodoroCount, // 已移除未使用
  isCurrentMonth,
  isToday,
  onDateClick,
  onTaskClick,
  // onTaskUpdate, // 已移除未使用的 prop
}) => {
  // 計算當日任務和子任務完成進度
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completedSubTasks = subTasks.filter(subTask => subTask.status === 'completed').length;
  const completedTempSubTasks = tempSubTasks.filter(tempSubTask => tempSubTask.status === 'completed').length;
  const totalTasks = tasks.length + subTasks.length + tempSubTasks.length;
  const completionRate = totalTasks > 0 ? ((completedTasks + completedSubTasks + completedTempSubTasks) / totalTasks) * 100 : 0;

  // 新增：分別計算子任務與臨時子任務的完成番茄鐘數
  const completedSubTaskPomodoros = subTasks.reduce((sum, subTask) => sum + (subTask.completedPomodoros || 0), 0);
  const completedTempSubTaskPomodoros = tempSubTasks.reduce((sum, tempSubTask) => sum + (tempSubTask.completedPomodoros || 0), 0);

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

      {/* 番茄鐘計數（新版：分開顯示） */}
      {(completedSubTaskPomodoros > 0 || completedTempSubTaskPomodoros > 0) && (
        <div className="flex items-center space-x-2 mb-2">
          {/* 子任務番茄鐘數 */}
          {completedSubTaskPomodoros > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{completedSubTaskPomodoros}</span>
            </div>
          )}
          {/* 臨時子任務番茄鐘數 */}
          {completedTempSubTaskPomodoros > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-xs text-gray-600">{completedTempSubTaskPomodoros}</span>
            </div>
          )}
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

        {/* 顯示臨時任務 */}
        {tempSubTasks.map(tempSubTask => {
          const progress = (tempSubTask.completedPomodoros / tempSubTask.pomodoros) * 100;
          const isCompleted = tempSubTask.status === 'completed';
          return (
            <div
              key={`tempsubtask-${tempSubTask.id}`}
              onClick={(e) => {
                e.stopPropagation();
                // 如果任務已完成，不允許點擊
                if (isCompleted) {
                  return;
                }
                // 臨時任務的點擊處理會在 Timer 組件中處理
                // 這裡可以添加提示或直接不響應點擊
              }}
              className={`p-1 rounded text-xs transition-colors border-l-2 border-black ${
                isCompleted
                  ? 'bg-green-50 text-green-700 cursor-not-allowed'
                  : tempSubTask.status === 'in-progress'
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 cursor-pointer'
              }`}
              title={isCompleted ? `${tempSubTask.name} - 已完成` : `${tempSubTask.name} - ${Math.round(progress)}% 完成`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{tempSubTask.shortName}</span>
                <span className="text-xs ml-1">{Math.round(progress)}%</span>
              </div>
              {/* 進度條 */}
              <div className="w-full bg-white bg-opacity-50 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500'
                      : tempSubTask.status === 'in-progress'
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

      {/* 完成數量指示器 */}
      <div className="absolute bottom-1 right-1 flex flex-col space-y-1">
        {/* 子任務完成數量 */}
        {completedSubTasks > 0 && (
          <div className="w-4 h-4 rounded-full bg-purple-400 border border-white flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {completedSubTasks}
            </span>
          </div>
        )}
        {/* 臨時子任務完成數量 */}
        {completedTempSubTasks > 0 && (
          <div className="w-4 h-4 rounded-full bg-black border border-white flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {completedTempSubTasks}
            </span>
          </div>
        )}
        {/* 總完成率指示器 */}
        {totalTasks > 0 && completedSubTasks === 0 && completedTempSubTasks === 0 && (
          <div className="w-4 h-4 rounded-full bg-white border border-gray-300 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {Math.round(completionRate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDay; 