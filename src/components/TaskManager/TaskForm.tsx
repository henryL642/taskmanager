import React, { useState, useEffect } from 'react';
import { Task } from '../../types';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
}

/**
 * 任務表單組件
 * 用於新增和編輯任務
 */
const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date().toISOString().split('T')[0],
    totalPomodoros: 1,
    isDaily: false,
    dailyPomodoros: 1,
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: '#ef4444',
    autoSplit: false, // 新增 autoSplit 欄位，預設 false
  });

  // 初始化表單數據
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        shortName: task.shortName || '',
        description: task.description || '',
        startDate: new Date(task.startDate).toISOString().split('T')[0],
        deadline: new Date(task.deadline).toISOString().split('T')[0],
        totalPomodoros: task.totalPomodoros,
        isDaily: task.isDaily,
        dailyPomodoros: task.dailyPomodoros || 1,
        priority: task.priority || 'medium',
        color: task.color || '#ef4444',
        autoSplit: task.isDaily ? true : (task.autoSplit ?? false), // 每日任務預設自動分配
      });
    }
  }, [task]);

  // 當 isDaily 切換時，自動設置 autoSplit
  useEffect(() => {
    if (formData.isDaily && !formData.autoSplit) {
      setFormData(prev => ({ ...prev, autoSplit: true }));
    }
  }, [formData.isDaily]);

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('請輸入任務名稱');
      return;
    }

    if (!formData.shortName.trim()) {
      alert('請輸入任務簡稱');
      return;
    }

    // 檢查簡稱長度
    if (formData.shortName.length > 2) {
      alert('任務簡稱不能超過2個字符');
      return;
    }

    // 檢查日期邏輯
    const startDate = new Date(formData.startDate);
    const deadline = new Date(formData.deadline);
    
    if (startDate > deadline) {
      alert('開始日期不能晚於截止日期');
      return;
    }

    const taskData: Partial<Task> = {
      name: formData.name.trim(),
      shortName: formData.shortName.trim().substring(0, 2), // 確保最多2個字符
      description: formData.description.trim() || undefined,
      startDate: startDate,
      deadline: deadline,
      totalPomodoros: formData.totalPomodoros,
      isDaily: formData.isDaily,
      dailyPomodoros: formData.isDaily ? formData.dailyPomodoros : undefined,
      priority: formData.priority,
      color: formData.color,
      autoSplit: formData.isDaily ? true : formData.autoSplit, // 每日任務預設自動分配
    };

    onSubmit(taskData);
  };

  // 處理輸入變化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {task ? '編輯任務' : '新增任務'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 任務名稱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            任務名稱 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="input-field"
            placeholder="輸入任務名稱"
            required
          />
        </div>

        {/* 任務簡稱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            任務簡稱 * <span className="text-xs text-gray-500">（最多2個中文字，用於行事曆顯示）</span>
          </label>
          <input
            type="text"
            value={formData.shortName}
            onChange={(e) => {
              const value = e.target.value;
              // 允許輸入，在提交時驗證長度
              handleInputChange('shortName', value);
            }}
            onBlur={(e) => {
              // 失去焦點時截取前2個字符
              const value = e.target.value;
              if (value.length > 2) {
                handleInputChange('shortName', value.substring(0, 2));
              }
            }}
            className="input-field"
            placeholder="輸入簡稱（如：學習、運動）"
            required
          />
          {formData.shortName.length > 2 && (
            <p className="text-xs text-red-500 mt-1">
              簡稱不能超過2個字符，將自動截取前2個字符
            </p>
          )}
        </div>

        {/* 任務描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            任務描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="輸入任務描述（可選）"
          />
        </div>

        {/* 開始日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始日期
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="input-field"
          />
        </div>

        {/* 截止日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            截止日期
          </label>
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => handleInputChange('deadline', e.target.value)}
            className="input-field"
          />
        </div>

        {/* 任務類型 */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isDaily}
              onChange={(e) => handleInputChange('isDaily', e.target.checked)}
              className="rounded border-gray-300 text-tomato-500 focus:ring-tomato-500"
            />
            <span className="text-sm font-medium text-gray-700">每日固定任務</span>
          </label>
        </div>

        {/* 番茄鐘數量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {formData.isDaily ? '每日番茄鐘數' : '總番茄鐘數'}
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={formData.isDaily ? formData.dailyPomodoros : formData.totalPomodoros}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              if (formData.isDaily) {
                handleInputChange('dailyPomodoros', value);
              } else {
                handleInputChange('totalPomodoros', value);
              }
            }}
            className="input-field"
          />
        </div>

        {/* 優先級 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            優先級
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="input-field"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        {/* 顏色標識 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            顏色標識
          </label>
          <div className="flex space-x-2">
            {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleInputChange('color', color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.color === color ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* 按鈕組 */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="btn-primary flex-1"
          >
            {task ? '更新任務' : '新增任務'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm; 