import React, { useState, useEffect } from 'react';
import { SubTask, Task } from '../../types';
import { generateId, formatDateLocal } from '../../utils/helpers';

interface SubTaskManagerProps {
  parentTask: Task;
  subTasks: SubTask[];
  onAddSubTask: (subTask: SubTask) => void;
  onUpdateSubTask: (subTask: SubTask) => void;
  onDeleteSubTask: (subTaskId: string) => void;
  onClose: () => void;
}

/**
 * 子任務管理組件
 * 允許用戶手動創建、編輯和刪除子任務
 */
const SubTaskManager: React.FC<SubTaskManagerProps> = ({
  parentTask,
  subTasks,
  onAddSubTask,
  onUpdateSubTask,
  onDeleteSubTask,
  onClose,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    pomodoros: 1,
  });

  // 初始化表單數據
  useEffect(() => {
    if (editingSubTask) {
      setFormData({
        name: editingSubTask.name,
        shortName: editingSubTask.shortName,
        description: editingSubTask.description || '',
        scheduledDate: new Date(editingSubTask.scheduledDate).toISOString().split('T')[0],
        pomodoros: editingSubTask.pomodoros,
      });
    } else {
      setFormData({
        name: '',
        shortName: '',
        description: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        pomodoros: 1,
      });
    }
  }, [editingSubTask]);

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('請輸入子任務名稱');
      return;
    }

    if (!formData.shortName.trim()) {
      alert('請輸入子任務簡稱');
      return;
    }

    // 檢查簡稱長度
    if (formData.shortName.length > 2) {
      alert('子任務簡稱不能超過2個字符');
      return;
    }

    // 檢查日期是否在父任務範圍內
    const scheduledDate = new Date(formData.scheduledDate);
    const startDate = new Date(parentTask.startDate);
    const deadline = new Date(parentTask.deadline);
    
    if (scheduledDate < startDate || scheduledDate > deadline) {
      alert('子任務日期必須在父任務的時間範圍內');
      return;
    }

    if (editingSubTask) {
      // 更新子任務
      const updatedSubTask: SubTask = {
        ...editingSubTask,
        name: formData.name.trim(),
        shortName: formData.shortName.trim().substring(0, 2),
        description: formData.description.trim() || undefined,
        scheduledDate: scheduledDate,
        pomodoros: formData.pomodoros,
        updatedAt: new Date(),
      };
      onUpdateSubTask(updatedSubTask);
    } else {
      // 新增子任務
      const newSubTask: SubTask = {
        id: generateId(),
        parentTaskId: parentTask.id,
        name: formData.name.trim(),
        shortName: formData.shortName.trim().substring(0, 2),
        description: formData.description.trim() || undefined,
        scheduledDate: scheduledDate,
        pomodoros: formData.pomodoros,
        completedPomodoros: 0,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        color: parentTask.color,
        priority: parentTask.priority,
      };
      onAddSubTask(newSubTask);
    }

    setShowForm(false);
    setEditingSubTask(null);
  };

  // 處理輸入變化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 編輯子任務
  const handleEditSubTask = (subTask: SubTask) => {
    setEditingSubTask(subTask);
    setShowForm(true);
  };

  // 刪除子任務
  const handleDeleteSubTask = (subTaskId: string) => {
    if (confirm('確定要刪除這個子任務嗎？')) {
      onDeleteSubTask(subTaskId);
    }
  };

  // 取消編輯
  const handleCancel = () => {
    setShowForm(false);
    setEditingSubTask(null);
  };

  // DEBUG: 輸出所有子任務和父任務ID，協助排查
  console.log('全部子任務', subTasks);
  console.log('當前主任務ID', parentTask.id);

  // 按日期排序並過濾出屬於當前主任務的子任務
  const sortedSubTasks = subTasks
    .filter(st => String(st.parentTaskId) === String(parentTask.id))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">子任務管理</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-1">父任務：{parentTask.name}</h4>
        <p className="text-xs text-gray-600">
          時間範圍：{formatDateLocal(parentTask.startDate)} ~ {formatDateLocal(parentTask.deadline)}
        </p>
      </div>

      {/* 子任務列表 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">子任務列表</h4>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm px-3 py-1"
          >
            新增子任務
          </button>
        </div>

        {sortedSubTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm">暫無子任務</p>
            <p className="text-xs mt-1">點擊上方按鈕新增子任務</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSubTasks.map(subTask => (
              <div
                key={subTask.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">
                      {subTask.name}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {subTask.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                    {subTask.shortName}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>排程: {formatDateLocal(new Date(subTask.scheduledDate))}</span>
                  <span>番茄鐘: {subTask.completedPomodoros}/{subTask.pomodoros}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-600">進度</span>
                      <span className="font-medium">
                        {Math.round((subTask.completedPomodoros / subTask.pomodoros) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          subTask.status === 'completed'
                            ? 'bg-green-500'
                            : subTask.status === 'in-progress'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${(subTask.completedPomodoros / subTask.pomodoros) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditSubTask(subTask)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="編輯子任務"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSubTask(subTask.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="刪除子任務"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 子任務表單 */}
      {showForm && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {editingSubTask ? '編輯子任務' : '新增子任務'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 子任務名稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                子任務名稱 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-field"
                placeholder="輸入子任務名稱"
                required
              />
            </div>

            {/* 子任務簡稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                子任務簡稱 * <span className="text-xs text-gray-500">（最多2個字符）</span>
              </label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => handleInputChange('shortName', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value.length > 2) {
                    handleInputChange('shortName', value.substring(0, 2));
                  }
                }}
                className="input-field"
                placeholder="輸入簡稱"
                required
              />
            </div>

            {/* 子任務描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                子任務描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input-field resize-none"
                rows={2}
                placeholder="輸入子任務描述（可選）"
              />
            </div>

            {/* 排程日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排程日期 *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                min={new Date(parentTask.startDate).toISOString().split('T')[0]}
                max={new Date(parentTask.deadline).toISOString().split('T')[0]}
                className="input-field"
                required
              />
            </div>

            {/* 番茄鐘數量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                番茄鐘數量 *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.pomodoros}
                onChange={(e) => handleInputChange('pomodoros', parseInt(e.target.value) || 1)}
                className="input-field"
                required
              />
            </div>

            {/* 按鈕組 */}
            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {editingSubTask ? '更新子任務' : '新增子任務'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubTaskManager; 