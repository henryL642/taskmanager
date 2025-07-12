import React from 'react';
import { Task } from '../../types';
import { formatDateLocal, calculateTaskProgress, getTaskStatusText, getPriorityText, getPriorityColor } from '../../utils/helpers';

interface TaskListProps {
  tasks: Task[];
  selectedTask: Task | null;
  onTaskSelect: (task: Task | null) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
}

/**
 * 任務列表組件
 * 顯示任務列表和基本操作
 */
const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTask,
  onTaskSelect,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
}) => {
  // 處理任務狀態切換
  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    const updatedTask: Task = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
    };
    onUpdateTask(updatedTask);
  };

  // 處理任務刪除
  const handleDeleteTask = (taskId: string) => {
    if (confirm('確定要刪除這個任務嗎？')) {
      onDeleteTask(taskId);
      if (selectedTask?.id === taskId) {
        onTaskSelect(null);
      }
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">沒有任務</h3>
        <p className="text-gray-600">開始新增你的第一個任務吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const progress = calculateTaskProgress(task);
        const isSelected = selectedTask?.id === task.id;
        const isOverdue = new Date() > task.deadline && task.status !== 'completed';

        return (
          <div
            key={task.id}
            className={`card cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-tomato-500 bg-tomato-50'
                : 'hover:border-gray-300 hover:shadow-md'
            } ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
            onClick={() => onTaskSelect(task)}
          >
            <div className="flex items-start justify-between">
              {/* 任務信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {task.name}
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {task.shortName}
                  </span>
                  {task.isDaily && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      每日
                    </span>
                  )}
                  {isOverdue && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      已過期
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* 任務詳情 */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>開始: {task.startDate instanceof Date ? formatDateLocal(task.startDate) : '無效日期'}</span>
                  <span>截止: {task.deadline instanceof Date ? formatDateLocal(task.deadline) : '無效日期'}</span>
                  <span>番茄鐘: {task.completedPomodoros}/{task.totalPomodoros}</span>
                  {task.priority && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                  )}
                </div>

                {/* 進度條 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">進度</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        task.status === 'completed'
                          ? 'bg-green-500'
                          : task.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-center space-x-2 ml-4">
                {/* 狀態切換 */}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-2 py-1 rounded border ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : task.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}
                >
                  <option value="pending">待處理</option>
                  <option value="in-progress">進行中</option>
                  <option value="completed">已完成</option>
                </select>

                {/* 編輯按鈕 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(task);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="編輯任務"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {/* 刪除按鈕 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="刪除任務"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 顏色標識 */}
            {task.color && (
              <div
                className="absolute top-2 right-2 w-3 h-3 rounded-full"
                style={{ backgroundColor: task.color }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList; 