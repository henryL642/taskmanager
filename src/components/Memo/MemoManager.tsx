import React, { useState, useEffect } from 'react';
import { Memo, MemoCategory, MemoCategoryConfig } from '../../types';
import { memoStorage } from '../../utils/storage';
import { generateId } from '../../utils/helpers';
import MemoForm from './MemoForm';
import MemoList from './MemoList';

// 備忘錄分類配置
const MEMO_CATEGORIES: MemoCategoryConfig[] = [
  { value: 'project', label: '專案', color: 'bg-blue-500', icon: '📋' },
  { value: 'idea', label: '新點子', color: 'bg-green-500', icon: '💡' },
  { value: 'interruption', label: '干擾', color: 'bg-red-500', icon: '⚠️' },
  { value: 'todo', label: '待辦', color: 'bg-yellow-500', icon: '📝' },
  { value: 'note', label: '筆記', color: 'bg-purple-500', icon: '📖' },
  { value: 'other', label: '其他', color: 'bg-gray-500', icon: '📌' },
];

interface MemoManagerProps {
  // 可以添加 props 如果需要
}

/**
 * 備忘錄管理組件
 * 提供備忘錄的增刪改查和分類功能
 */
const MemoManager: React.FC<MemoManagerProps> = () => {
  // 狀態管理
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MemoCategory | 'all'>('all');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 載入備忘錄數據
  useEffect(() => {
    const loadMemos = () => {
      const loadedMemos = memoStorage.getAll();
      setMemos(loadedMemos);
    };

    loadMemos();
  }, []);

  // 過濾和排序備忘錄
  const filteredAndSortedMemos = memos
    .filter(memo => {
      // 分類過濾
      if (selectedCategory !== 'all' && memo.category !== selectedCategory) {
        return false;
      }
      
      // 搜尋過濾
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          memo.title.toLowerCase().includes(searchLower) ||
          memo.content.toLowerCase().includes(searchLower) ||
          (memo.tags && memo.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 添加備忘錄
  const handleAddMemo = (memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMemo: Memo = {
      ...memoData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMemos = [...memos, newMemo];
    setMemos(updatedMemos);
    memoStorage.saveAll(updatedMemos);
    setShowForm(false);
  };

  // 更新備忘錄
  const handleUpdateMemo = (memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingMemo) return;
    
    const updatedMemo: Memo = {
      ...memoData,
      id: editingMemo.id,
      createdAt: editingMemo.createdAt,
      updatedAt: new Date(),
    };
    
    const updatedMemos = memos.map(memo => 
      memo.id === updatedMemo.id ? updatedMemo : memo
    );
    setMemos(updatedMemos);
    memoStorage.saveAll(updatedMemos);
    setEditingMemo(null);
    setShowForm(false);
  };

  // 刪除備忘錄
  const handleDeleteMemo = (memoId: string) => {
    if (window.confirm('確定要刪除這個備忘錄嗎？')) {
      const updatedMemos = memos.filter(memo => memo.id !== memoId);
      setMemos(updatedMemos);
      memoStorage.saveAll(updatedMemos);
    }
  };

  // 切換置頂狀態
  const handleTogglePin = (memoId: string) => {
    const updatedMemos = memos.map(memo => 
      memo.id === memoId ? { ...memo, isPinned: !memo.isPinned, updatedAt: new Date() } : memo
    );
    setMemos(updatedMemos);
    memoStorage.saveAll(updatedMemos);
  };

  // 開始編輯備忘錄
  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setShowForm(true);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingMemo(null);
    setShowForm(false);
  };

  // 獲取分類統計
  const getCategoryStats = () => {
    const stats: Record<MemoCategory, number> = {
      project: 0,
      idea: 0,
      interruption: 0,
      todo: 0,
      note: 0,
      other: 0,
    };

    memos.forEach(memo => {
      stats[memo.category]++;
    });

    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="h-full flex flex-col">
      {/* 標題 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">備忘錄</h2>
        <p className="text-gray-600 mt-1">
          記錄工作期間的想法、干擾和重要事項
        </p>
      </div>

      {/* 快速添加按鈕 */}
      <div className="mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary px-4 py-2 text-sm"
        >
          ➕ 新增備忘錄
        </button>
      </div>

      {/* 分類統計 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">分類統計</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {MEMO_CATEGORIES.map(category => (
            <div
              key={category.value}
              className="flex items-center space-x-2 p-2 bg-white rounded border"
            >
              <span className="text-sm">{category.icon}</span>
              <span className="text-xs font-medium text-gray-700">{category.label}</span>
              <span className="text-xs text-gray-500">({categoryStats[category.value]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 過濾和搜尋 */}
      <div className="mb-4 space-y-3">
        {/* 分類過濾 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs rounded-full border ${
              selectedCategory === 'all'
                ? 'bg-tomato-500 text-white border-tomato-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部 ({memos.length})
          </button>
          {MEMO_CATEGORIES.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-1 text-xs rounded-full border flex items-center space-x-1 ${
                selectedCategory === category.value
                  ? 'bg-tomato-500 text-white border-tomato-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label} ({categoryStats[category.value]})</span>
            </button>
          ))}
        </div>

        {/* 搜尋和排序 */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜尋備忘錄..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'priority' | 'title')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-tomato-500 focus:border-transparent"
            >
              <option value="createdAt">按時間</option>
              <option value="priority">按優先級</option>
              <option value="title">按標題</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* 備忘錄表單 */}
      {showForm && (
        <div className="mb-4">
          <MemoForm
            memo={editingMemo}
            categories={MEMO_CATEGORIES}
            onSubmit={editingMemo ? handleUpdateMemo : handleAddMemo}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* 備忘錄列表 */}
      <div className="flex-1 overflow-y-auto">
        <MemoList
          memos={filteredAndSortedMemos}
          categories={MEMO_CATEGORIES}
          onEdit={handleEditMemo}
          onDelete={handleDeleteMemo}
          onTogglePin={handleTogglePin}
        />
      </div>

      {/* 空狀態 */}
      {filteredAndSortedMemos.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? '沒有找到符合條件的備忘錄' 
                : '還沒有備忘錄，開始記錄您的想法吧！'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoManager; 