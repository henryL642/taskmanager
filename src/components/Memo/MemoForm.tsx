import React, { useState, useEffect } from 'react';
import { Memo, MemoCategoryConfig } from '../../types';

interface MemoFormProps {
  memo?: Memo | null;
  categories: MemoCategoryConfig[];
  onSubmit: (memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

/**
 * 備忘錄表單組件
 * 用於新增和編輯備忘錄
 */
const MemoForm: React.FC<MemoFormProps> = ({ memo, categories, onSubmit, onCancel }) => {
  // 表單狀態
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<string>('idea');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [tags, setTags] = useState<string>('');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表單數據
  useEffect(() => {
    if (memo) {
      setTitle(memo.title);
      setContent(memo.content);
      setCategory(memo.category);
      setPriority(memo.priority);
      setStatus(memo.status);
      setTags(memo.tags ? memo.tags.join(', ') : '');
      setIsPinned(memo.isPinned || false);
    } else {
      // 重置為預設值
      setTitle('');
      setContent('');
      setCategory('idea');
      setPriority('medium');
      setStatus('pending');
      setTags('');
      setIsPinned(false);
    }
    setErrors({});
  }, [memo]);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '標題不能為空';
    } else if (title.trim().length < 2) {
      newErrors.title = '標題至少需要2個字符';
    }

    if (!content.trim()) {
      newErrors.content = '內容不能為空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理標籤輸入
  const handleTagsChange = (value: string) => {
    setTags(value);
    // 自動格式化標籤（移除多餘空格，用逗號分隔）
    const formattedTags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .join(', ');
    if (formattedTags !== value) {
      setTags(formattedTags);
    }
  };

  // 提交表單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 處理標籤
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      content: content.trim(),
      category: category as any,
      priority,
      status,
      tags: tagArray.length > 0 ? tagArray : undefined,
      isPinned,
    };

    onSubmit(memoData);
  };

  // 取消編輯
  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      if (window.confirm('確定要取消編輯嗎？未保存的內容將會丟失。')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {memo ? '編輯備忘錄' : '新增備忘錄'}
        </h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 標題 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            標題 *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="輸入備忘錄標題..."
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* 內容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            內容 *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="詳細描述您的想法、干擾或重要事項..."
            maxLength={1000}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {content.length}/1000 字符
          </p>
        </div>

        {/* 分類和優先級 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              分類
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              優先級
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
            >
              <option value="low">🔵 低</option>
              <option value="medium">🟡 中</option>
              <option value="high">🔴 高</option>
            </select>
          </div>
        </div>

        {/* 狀態和置頂 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              狀態
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'in-progress' | 'completed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
            >
              <option value="pending">⏳ 待處理</option>
              <option value="in-progress">🔄 進行中</option>
              <option value="completed">✅ 已完成</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-tomato-500 border-gray-300 rounded focus:ring-tomato-500"
              />
              <span className="text-sm font-medium text-gray-700">📌 置頂</span>
            </label>
          </div>
        </div>

        {/* 標籤 */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            標籤
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => handleTagsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
            placeholder="用逗號分隔多個標籤，例如：重要, 緊急, 會議"
          />
          <p className="mt-1 text-xs text-gray-500">
            標籤用於快速分類和搜尋
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-tomato-500 border border-transparent rounded-lg hover:bg-tomato-600 focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
          >
            {memo ? '更新' : '新增'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemoForm; 