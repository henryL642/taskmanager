import React, { useState } from 'react';
import { Task, SubTask } from '../../types';
import { generateId, formatDateLocal, getTaskStatusText, getPriorityText, getPriorityColor, splitTaskIntoSubTasks } from '../../utils/helpers';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import SubTaskManager from './SubTaskManager';

interface TaskManagerProps {
  tasks: Task[];
  subTasks: SubTask[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubTask: (subTask: SubTask) => void;
  onAddSubTasks: (subTasks: SubTask[]) => void;
  onUpdateSubTask: (subTask: SubTask) => void;
  onDeleteSubTask: (subTaskId: string) => void;
  selectedTask: Task | null;
  onTaskSelect: (task: Task | null) => void;
}

/**
 * 任務管理組件
 * 包含任務列表、新增任務表單和任務詳情
 */
const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  subTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubTask,
  onAddSubTasks,
  onUpdateSubTask,
  onDeleteSubTask,
  selectedTask,
  onTaskSelect,
}) => {
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [showSubTaskManager, setShowSubTaskManager] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline');

  // 過濾任務
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  // 排序任務
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority || 'low'] || 0) - (priorityOrder[a.priority || 'low'] || 0);
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'status':
        const statusOrder = { 'in-progress': 3, pending: 2, completed: 1 };
        return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
      default:
        return 0;
    }
  });

  // 新增任務
  const handleAddTask = (taskData: Partial<Task>) => {
    console.log('TaskManager handleAddTask 接收到的任務數據:', taskData);
    
    const newTask: Task = {
      id: generateId(),
      name: taskData.name || '',
      shortName: taskData.shortName || '',
      description: taskData.description || '',
      startDate: taskData.startDate || new Date(),
      deadline: taskData.deadline || new Date(),
      totalPomodoros: taskData.totalPomodoros || 1,
      completedPomodoros: 0,
      isDaily: taskData.isDaily || false,
      dailyPomodoros: taskData.dailyPomodoros,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      color: taskData.color,
      priority: taskData.priority || 'medium',
      autoSplit: taskData.isDaily ? true : (taskData.autoSplit || false), // 每日任務自動啟用分解
    };
    
    console.log('TaskManager handleAddTask 創建的任務對象:', {
      id: newTask.id,
      name: newTask.name,
      isDaily: newTask.isDaily,
      startDate: newTask.startDate.toISOString().split('T')[0],
      deadline: newTask.deadline.toISOString().split('T')[0],
      dailyPomodoros: newTask.dailyPomodoros
    });

    // 先添加主任務
    onAddTask(newTask);

    // 如果是每日任務，自動生成子任務
    if (newTask.isDaily) {
      console.log('開始生成每日任務的子任務:', {
        taskName: newTask.name,
        startDate: newTask.startDate.toISOString().split('T')[0],
        deadline: newTask.deadline.toISOString().split('T')[0],
        isDaily: newTask.isDaily,
        dailyPomodoros: newTask.dailyPomodoros
      });
      
      const generatedSubTasks = splitTaskIntoSubTasks(newTask);
      console.log('每日任務自動生成的子任務:', generatedSubTasks);
      console.log('主任務ID:', newTask.id);
      
      // 批量添加子任務
      console.log('批量添加子任務:', generatedSubTasks.length, '個');
      onAddSubTasks(generatedSubTasks);
    }

    setShowTaskForm(false);
  };

  // 編輯任務
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // 更新任務
  const handleUpdateTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      const updatedTask: Task = {
        ...editingTask,
        ...taskData,
        updatedAt: new Date(),
      };
      onUpdateTask(updatedTask);
      setEditingTask(null);
      setShowTaskForm(false);
    }
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingTask(null);
    setShowTaskForm(false);
  };

  // 任務統計
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* 標題和操作按鈕 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">任務管理</h2>
          <p className="text-gray-600 mt-1">
            管理你的任務，設定目標和番茄鐘數量
          </p>
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="btn-primary"
        >
          新增任務
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-sm text-gray-600">總任務</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-600">已完成</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-sm text-gray-600">進行中</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
          <div className="text-sm text-gray-600">待處理</div>
        </div>
      </div>

      {/* 過濾和排序控制 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-32"
          >
            <option value="all">全部狀態</option>
            <option value="pending">待處理</option>
            <option value="in-progress">進行中</option>
            <option value="completed">已完成</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-32"
          >
            <option value="deadline">按截止日期</option>
            <option value="name">按名稱</option>
            <option value="priority">按優先級</option>
            <option value="createdAt">按創建時間</option>
            <option value="status">按狀態</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          共 {sortedTasks.length} 個任務
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex gap-6">
        {/* 任務列表 */}
        <div className="flex-1">
          <TaskList
            tasks={sortedTasks}
            selectedTask={selectedTask}
            onTaskSelect={onTaskSelect}
            onEditTask={handleEditTask}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
          />
        </div>

        {/* 任務詳情、新增表單或子任務管理 */}
        <div className="w-96">
          {showSubTaskManager && selectedTask ? (
            <SubTaskManager
              parentTask={selectedTask}
              subTasks={subTasks.filter(st => st.parentTaskId === selectedTask.id)}
              onAddSubTask={onAddSubTask}
              onUpdateSubTask={onUpdateSubTask}
              onDeleteSubTask={onDeleteSubTask}
              onClose={() => setShowSubTaskManager(false)}
            />
          ) : showTaskForm ? (
            <TaskForm
              task={editingTask}
              onSubmit={editingTask ? handleUpdateTask : handleAddTask}
              onCancel={handleCancelEdit}
            />
          ) : selectedTask ? (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">任務詳情</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">任務名稱</label>
                  <p className="text-gray-900">{selectedTask.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">任務簡稱</label>
                  <p className="text-gray-900">{selectedTask.shortName}</p>
                </div>
                
                {selectedTask.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <p className="text-gray-900">{selectedTask.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
                  <p className="text-gray-900">{formatDateLocal(selectedTask.startDate)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                  <p className="text-gray-900">{formatDateLocal(selectedTask.deadline)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">番茄鐘進度</label>
                  <p className="text-gray-900">
                    {selectedTask.completedPomodoros} / {selectedTask.totalPomodoros}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTask.status === 'completed' ? 'task-status-completed' :
                    selectedTask.status === 'in-progress' ? 'task-status-in-progress' :
                    'task-status-pending'
                  }`}>
                    {getTaskStatusText(selectedTask.status)}
                  </span>
                </div>

                {selectedTask.priority && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">優先級</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                      {getPriorityText(selectedTask.priority)}
                    </span>
                  </div>
                )}

                {/* 子任務管理按鈕 */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowSubTaskManager(true)}
                    className="btn-secondary w-full mb-2"
                  >
                    管理子任務
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditTask(selectedTask)}
                    className="btn-primary w-full mb-2"
                  >
                    編輯任務
                  </button>
                  <button
                    onClick={() => onTaskSelect(null)}
                    className="btn-secondary w-full"
                  >
                    關閉詳情
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center text-gray-500">
              <p>選擇一個任務查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager; 