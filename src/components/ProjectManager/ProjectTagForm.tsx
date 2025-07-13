import React, { useState, useEffect } from 'react';
import { ProjectTag, ProjectType, ProjectStatus } from '../../types';

interface ProjectTagFormProps {
  projectTag?: ProjectTag; // 如果是編輯模式，傳入現有專案標籤
  onSubmit: (projectTag: ProjectTag) => void;
  onCancel: () => void;
}

/**
 * 專案標籤表單組件
 * 用於創建和編輯專案標籤
 */
const ProjectTagForm: React.FC<ProjectTagFormProps> = ({
  projectTag,
  onSubmit,
  onCancel,
}) => {
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'quarterly' as ProjectType,
    startDate: '',
    endDate: '',
    color: '#3B82F6', // 預設藍色
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'active' as ProjectStatus,
  });

  // 錯誤狀態
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 如果是編輯模式，載入現有資料
  useEffect(() => {
    if (projectTag) {
      setFormData({
        name: projectTag.name,
        description: projectTag.description || '',
        type: projectTag.type,
        startDate: projectTag.startDate.toISOString().split('T')[0],
        endDate: projectTag.endDate.toISOString().split('T')[0],
        color: projectTag.color,
        priority: projectTag.priority,
        status: projectTag.status,
      });
    }
  }, [projectTag]);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '專案名稱不能為空';
    }

    if (!formData.startDate) {
      newErrors.startDate = '請選擇開始日期';
    }

    if (!formData.endDate) {
      newErrors.endDate = '請選擇結束日期';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        newErrors.endDate = '結束日期必須晚於開始日期';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newProjectTag: ProjectTag = {
      id: projectTag?.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      color: formData.color,
      priority: formData.priority,
      status: formData.status,
      createdAt: projectTag?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSubmit(newProjectTag);
  };

  // 處理輸入變更
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除對應的錯誤訊息
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 預設顏色選項
  const colorOptions = [
    { value: '#3B82F6', label: '藍色', bg: 'bg-blue-500' },
    { value: '#EF4444', label: '紅色', bg: 'bg-red-500' },
    { value: '#10B981', label: '綠色', bg: 'bg-green-500' },
    { value: '#F59E0B', label: '黃色', bg: 'bg-yellow-500' },
    { value: '#8B5CF6', label: '紫色', bg: 'bg-purple-500' },
    { value: '#F97316', label: '橙色', bg: 'bg-orange-500' },
    { value: '#06B6D4', label: '青色', bg: 'bg-cyan-500' },
    { value: '#EC4899', label: '粉色', bg: 'bg-pink-500' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {projectTag ? '編輯專案標籤' : '創建專案標籤'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 專案名稱 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            專案名稱 *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例如：2024 Q1 產品開發"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* 專案描述 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            專案描述
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            placeholder="描述這個專案的目標和範圍..."
          />
        </div>

        {/* 專案類型和日期 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 專案類型 */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              專案類型
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            >
              <option value="quarterly">季度目標</option>
              <option value="yearly">年度目標</option>
              <option value="custom">自定義專案</option>
            </select>
          </div>

          {/* 開始日期 */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              開始日期 *
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500 ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
          </div>

          {/* 結束日期 */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              結束日期 *
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500 ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* 顏色和優先級 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 專案顏色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              專案顏色
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* 優先級 */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              優先級
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
        </div>

        {/* 專案狀態 */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            專案狀態
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
          >
            <option value="active">進行中</option>
            <option value="completed">已完成</option>
            <option value="archived">已歸檔</option>
          </select>
        </div>

        {/* 按鈕組 */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-tomato-500 text-white rounded-lg hover:bg-tomato-600 transition-colors"
          >
            {projectTag ? '更新專案' : '創建專案'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectTagForm; 