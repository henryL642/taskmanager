import React, { useState, useEffect } from 'react';
import { ProjectTag, Task } from '../../types';
import { projectTagStorage, taskStorage } from '../../utils/storage';
import ProjectTagForm from './ProjectTagForm';
import ProjectTagList from './ProjectTagList';
import { Plus, Search } from 'lucide-react';

/**
 * 專案管理主組件
 * 整合專案標籤的創建、編輯、刪除等功能
 */
const ProjectManager: React.FC = () => {
  // 狀態管理
  const [projectTags, setProjectTags] = useState<ProjectTag[]>([]);
  const [filteredProjectTags, setFilteredProjectTags] = useState<ProjectTag[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProjectTag, setEditingProjectTag] = useState<ProjectTag | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quarterly' | 'yearly' | 'custom'>('all');

  // 載入專案標籤
  const loadProjectTags = () => {
    const tags = projectTagStorage.getAll();
    setProjectTags(tags);
  };

  // 篩選專案標籤
  const filterProjectTags = () => {
    let filtered = projectTags;

    // 按狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tag => tag.status === statusFilter);
    }

    // 按類型篩選
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tag => tag.type === typeFilter);
    }

    // 按搜尋詞篩選
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(term) ||
        (tag.description && tag.description.toLowerCase().includes(term))
      );
    }

    setFilteredProjectTags(filtered);
  };

  // 處理專案標籤提交
  const handleSubmit = (projectTag: ProjectTag) => {
    if (editingProjectTag) {
      // 更新現有專案標籤
      projectTagStorage.update(projectTag);
    } else {
      // 創建新專案標籤
      projectTagStorage.add(projectTag);
    }
    
    loadProjectTags();
    setShowForm(false);
    setEditingProjectTag(undefined);
  };

  // 處理編輯
  const handleEdit = (projectTag: ProjectTag) => {
    setEditingProjectTag(projectTag);
    setShowForm(true);
  };

  // 處理刪除
  const handleDelete = (projectTagId: string) => {
    // 檢查是否有任務使用此專案標籤
    const tasks = taskStorage.getAll();
    const tasksUsingProject = tasks.filter((task: Task) => task.projectTagId === projectTagId);
    
    let confirmMessage = '確定要刪除這個專案標籤嗎？';
    if (tasksUsingProject.length > 0) {
      confirmMessage += `\n\n注意：有 ${tasksUsingProject.length} 個任務正在使用此專案標籤，刪除後這些任務將失去專案標籤。`;
    }
    
    if (confirm(confirmMessage)) {
      // 清除相關任務的專案標籤
      if (tasksUsingProject.length > 0) {
        const updatedTasks = tasks.map((task: Task) => 
          task.projectTagId === projectTagId 
            ? { ...task, projectTagId: undefined, updatedAt: new Date() }
            : task
        );
        taskStorage.saveAll(updatedTasks);
      }
      
      projectTagStorage.delete(projectTagId);
      loadProjectTags();
    }
  };

  // 處理歸檔
  const handleArchive = (projectTagId: string) => {
    const projectTag = projectTags.find(tag => tag.id === projectTagId);
    if (projectTag) {
      if (confirm(`確定要歸檔專案「${projectTag.name}」嗎？\n\n歸檔後專案將移至歸檔資料夾，但仍可隨時恢復。`)) {
        const updatedProjectTag = { ...projectTag, status: 'archived' as const };
        projectTagStorage.update(updatedProjectTag);
        loadProjectTags();
        
        // 顯示成功提示
        alert(`專案「${projectTag.name}」已成功歸檔！\n\n你可以在「已歸檔」狀態中查看和恢復該專案。`);
      }
    }
  };

  // 處理恢復
  const handleRestore = (projectTagId: string) => {
    const projectTag = projectTags.find(tag => tag.id === projectTagId);
    if (projectTag) {
      if (confirm(`確定要恢復專案「${projectTag.name}」嗎？\n\n恢復後專案將重新設為進行中狀態。`)) {
        const updatedProjectTag = { ...projectTag, status: 'active' as const };
        projectTagStorage.update(updatedProjectTag);
        loadProjectTags();
        
        // 顯示成功提示
        alert(`專案「${projectTag.name}」已成功恢復！\n\n專案現在重新設為進行中狀態。`);
      }
    }
  };

  // 處理取消
  const handleCancel = () => {
    setShowForm(false);
    setEditingProjectTag(undefined);
  };

  // 初始化載入
  useEffect(() => {
    loadProjectTags();
  }, []);

  // 篩選效果
  useEffect(() => {
    filterProjectTags();
  }, [projectTags, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* 頁面標題和操作按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {statusFilter === 'archived' ? '歸檔資料夾' : '專案管理'}
          </h1>
          <p className="text-gray-600 mt-1">
            {statusFilter === 'archived' 
              ? '查看和管理已歸檔的專案' 
              : '管理你的季度目標、年度目標和自定義專案'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {statusFilter === 'archived' ? (
            // 在歸檔資料夾中顯示返回按鈕
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>返回專案管理</span>
            </button>
          ) : (
            // 在專案管理中顯示歸檔資料夾按鈕
            <button
              onClick={() => setStatusFilter('archived')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>歸檔資料夾 ({projectTags.filter(tag => tag.status === 'archived').length})</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-tomato-500 text-white rounded-lg hover:bg-tomato-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>創建專案</span>
          </button>
        </div>
      </div>

      {/* 篩選和搜尋 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜尋 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋專案..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            />
          </div>

          {/* 狀態篩選 */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            >
              <option value="all">全部狀態</option>
              <option value="active">進行中</option>
              <option value="completed">已完成</option>
              <option value="archived">已歸檔</option>
            </select>
          </div>

          {/* 類型篩選 */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            >
              <option value="all">全部類型</option>
              <option value="quarterly">季度目標</option>
              <option value="yearly">年度目標</option>
              <option value="custom">自定義專案</option>
            </select>
          </div>

          {/* 統計信息 */}
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-600">
              共 {filteredProjectTags.length} 個專案
            </span>
            <span className="text-sm text-gray-400">
              | 歸檔: {projectTags.filter(tag => tag.status === 'archived').length} 個
            </span>
          </div>
        </div>
      </div>

      {/* 專案標籤表單 */}
      {showForm && (
        <ProjectTagForm
          projectTag={editingProjectTag}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* 歸檔資料夾介面 */}
      {statusFilter === 'archived' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">歸檔資料夾</h3>
                <p className="text-sm text-gray-600">存放已歸檔的專案，可隨時恢復</p>
              </div>
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>返回</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {projectTags.filter(tag => tag.status === 'archived').length}
              </div>
              <div className="text-sm text-gray-600">已歸檔專案</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {projectTags.filter(tag => tag.status === 'archived' && tag.type === 'quarterly').length}
              </div>
              <div className="text-sm text-gray-600">季度目標</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {projectTags.filter(tag => tag.status === 'archived' && tag.type === 'yearly').length}
              </div>
              <div className="text-sm text-gray-600">年度目標</div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">歸檔管理說明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 歸檔的專案保存在此資料夾中，不會被刪除</li>
              <li>• 可以隨時點擊「恢復」按鈕將專案重新設為活躍狀態</li>
              <li>• 歸檔的專案不會影響任務的正常使用</li>
              <li>• 可以通過搜尋和篩選快速找到需要的專案</li>
            </ul>
          </div>
        </div>
      )}

      {/* 專案標籤列表 */}
      <ProjectTagList
        projectTags={filteredProjectTags}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />
    </div>
  );
};

export default ProjectManager; 