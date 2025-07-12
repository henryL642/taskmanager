import React from 'react';
import { Task, SubTask, PomodoroRecord } from '../../types';
import { getPomodorosForDate, isTodaySubTask } from '../../utils/helpers';

interface SidebarProps {
  isOpen: boolean;
  tasks: Task[];
  subTasks: SubTask[];
  pomodoroRecords: PomodoroRecord[];
  selectedTask: Task | null;
  onTaskSelect: (task: Task | null, subTask?: SubTask | null) => void;
  onViewChange: (view: 'calendar' | 'tasks' | 'charts') => void;
}

/**
 * 側邊欄組件
 * 顯示任務列表和快速操作
 */
const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  tasks,
  subTasks,
  pomodoroRecords,
  selectedTask,
  onTaskSelect,
  onViewChange,
}) => {
  // 獲取今日任務
  const todayTasks = tasks.filter(task => {
    const today = new Date();
    const startDate = new Date(task.startDate);
    const deadline = new Date(task.deadline);
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    deadline.setHours(23, 59, 59, 999);
    // 每日任務 - 檢查是否在有效期間內
    if (task.isDaily) {
      return today >= startDate && today <= deadline;
    }
    // 非每日任務：只有今天有子任務屬於該主任務且排程在今天才顯示
    const hasSubTaskToday = subTasks.some(
      st => st.parentTaskId === task.id &&
            new Date(st.scheduledDate).setHours(0,0,0,0) === today.getTime()
    );
    return hasSubTaskToday;
  });

  // 獲取今日子任務
  const todaySubTasks = subTasks.filter(subTask => isTodaySubTask(subTask));

  // 獲取進行中的任務
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  // 獲取待處理任務
  const pendingTasks = tasks.filter(task => task.status === 'pending');

  // 獲取今日番茄鐘數
  const todayPomodoros = getPomodorosForDate(pomodoroRecords, new Date());

  // 任務狀態統計
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: inProgressTasks.length,
    pending: pendingTasks.length,
  };

  return (
    <aside className={`fixed left-0 top-16 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-40 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`} style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="h-full overflow-y-auto">
        {/* 統計概覽 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">今日概覽</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-tomato-50 rounded-lg">
              <div className="text-2xl font-bold text-tomato-600">{todayPomodoros}</div>
              <div className="text-xs text-gray-600">番茄鐘</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayTasks.length + todaySubTasks.length}</div>
              <div className="text-xs text-gray-600">今日任務</div>
            </div>
          </div>
        </div>

        {/* 任務統計 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">任務統計</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">總任務</span>
              <span className="font-medium">{taskStats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">已完成</span>
              <span className="font-medium text-green-600">{taskStats.completed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">進行中</span>
              <span className="font-medium text-blue-600">{taskStats.inProgress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">待處理</span>
              <span className="font-medium text-yellow-600">{taskStats.pending}</span>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">快速操作</h3>
          <div className="space-y-2">
            <button
              onClick={() => onViewChange('tasks')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              📝 新增任務
            </button>
            <button
              onClick={() => onViewChange('calendar')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              📅 查看月曆
            </button>
            <button
              onClick={() => onViewChange('charts')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              📊 查看統計
            </button>
          </div>
        </div>

        {/* 今日任務和子任務列表 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">今日任務</h3>
          {(todayTasks.length === 0 && todaySubTasks.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm">沒有今日任務</p>
              <p className="text-xs mt-1">好好享受這一天吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 顯示任務 */}
              {todayTasks.map(task => (
                <div
                  key={`task-${task.id}`}
                  onClick={() => onTaskSelect(task)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTask?.id === task.id
                      ? 'border-tomato-500 bg-tomato-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {task.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {task.shortName}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'task-status-completed' :
                          task.status === 'in-progress' ? 'task-status-in-progress' :
                          'task-status-pending'
                        }`}>
                          {task.status === 'completed' ? '已完成' :
                           task.status === 'in-progress' ? '進行中' : '待處理'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.completedPomodoros}/{task.totalPomodoros} 番茄鐘
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 顯示子任務 */}
              {todaySubTasks.map(subTask => (
                <div
                  key={`subtask-${subTask.id}`}
                  onClick={() => onTaskSelect(null, subTask)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors border-l-4 border-purple-400 ${
                    selectedTask?.id === subTask.id
                      ? 'border-tomato-500 bg-tomato-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {subTask.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded">
                          {subTask.shortName}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subTask.status === 'completed' ? 'task-status-completed' :
                          subTask.status === 'in-progress' ? 'task-status-in-progress' :
                          'task-status-pending'
                        }`}>
                          {subTask.status === 'completed' ? '已完成' :
                           subTask.status === 'in-progress' ? '進行中' : '待處理'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {subTask.completedPomodoros}/{subTask.pomodoros} 番茄鐘
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="p-4">
          <div className="text-xs text-gray-500 text-center">
            <p>番茄鐘任務管理系統</p>
            <p className="mt-1">專注於高效工作</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 