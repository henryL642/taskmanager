import React from 'react';
import { Memo, MemoCategoryConfig } from '../../types';

interface MemoListProps {
  memos: Memo[];
  categories: MemoCategoryConfig[];
  onEdit: (memo: Memo) => void;
  onDelete: (memoId: string) => void;
  onTogglePin: (memoId: string) => void;
}

/**
 * 備忘錄列表組件
 * 以卡片形式顯示備忘錄，支持編輯、刪除和置頂操作
 */
const MemoList: React.FC<MemoListProps> = ({ memos, categories, onEdit, onDelete, onTogglePin }) => {
  // 獲取分類配置
  const getCategoryConfig = (categoryValue: string): MemoCategoryConfig => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  // 獲取優先級顏色
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '今天';
    } else if (diffDays === 2) {
      return '昨天';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}天前`;
    } else {
      return date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // 截斷文本
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {memos.map(memo => {
        const categoryConfig = getCategoryConfig(memo.category);
        
        return (
          <div
            key={memo.id}
            className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              memo.isPinned ? 'border-tomato-300 bg-tomato-50' : 'border-gray-200'
            }`}
          >
            {/* 標題和操作 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {memo.isPinned && (
                    <span className="text-tomato-500 text-sm">📌</span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {memo.title}
                  </h3>
                </div>
                
                {/* 分類和時間 */}
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span>{categoryConfig.icon}</span>
                    <span>{categoryConfig.label}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDate(memo.createdAt)}</span>
                  {memo.updatedAt.getTime() !== memo.createdAt.getTime() && (
                    <>
                      <span>•</span>
                      <span>已編輯</span>
                    </>
                  )}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => onTogglePin(memo.id)}
                  className={`p-1 rounded text-sm ${
                    memo.isPinned 
                      ? 'text-tomato-500 hover:text-tomato-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={memo.isPinned ? '取消置頂' : '置頂'}
                >
                  📌
                </button>
                <button
                  onClick={() => onEdit(memo)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 text-sm"
                  title="編輯"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(memo.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-600 text-sm"
                  title="刪除"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* 內容 */}
            <div className="mb-3">
              <p className="text-gray-700 text-sm leading-relaxed">
                {truncateText(memo.content, 200)}
              </p>
            </div>

            {/* 標籤 */}
            {memo.tags && memo.tags.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {memo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 狀態和優先級 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(memo.priority)}`}>
                  {memo.priority === 'high' ? '🔴 高' : 
                   memo.priority === 'medium' ? '🟡 中' : '🔵 低'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(memo.status)}`}>
                  {memo.status === 'completed' ? '✅ 已完成' :
                   memo.status === 'in-progress' ? '🔄 進行中' : '⏳ 待處理'}
                </span>
              </div>

              {/* 字數統計 */}
              <div className="text-xs text-gray-400">
                {memo.content.length} 字符
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemoList; 