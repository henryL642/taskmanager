import React from 'react';
import { ProjectTag, ProjectType } from '../../types';
import { Edit, Trash2, Archive, RotateCcw, Calendar, Target, Tag } from 'lucide-react';

interface ProjectTagListProps {
  projectTags: ProjectTag[];
  onEdit: (projectTag: ProjectTag) => void;
  onDelete: (projectTagId: string) => void;
  onArchive: (projectTagId: string) => void;
  onRestore: (projectTagId: string) => void;
}

/**
 * 專案標籤列表組件
 * 用於顯示和管理專案標籤
 */
const ProjectTagList: React.FC<ProjectTagListProps> = ({
  projectTags,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
}) => {
  // 獲取專案類型圖標
  const getTypeIcon = (type: ProjectType) => {
    switch (type) {
      case 'quarterly':
        return <Calendar className="w-4 h-4" />;
      case 'yearly':
        return <Target className="w-4 h-4" />;
      case 'custom':
        return <Tag className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  // 獲取專案類型標籤
  const getTypeLabel = (type: ProjectType) => {
    switch (type) {
      case 'quarterly':
        return '季度目標';
      case 'yearly':
        return '年度目標';
      case 'custom':
        return '自定義專案';
      default:
        return '未知類型';
    }
  };

  // 獲取狀態標籤樣式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取優先級標籤樣式
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 計算專案進度（基於日期）
  const calculateProgress = (projectTag: ProjectTag) => {
    const now = new Date();
    const start = new Date(projectTag.startDate);
    const end = new Date(projectTag.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  if (projectTags.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">尚無專案標籤</h3>
        <p className="text-gray-500">創建第一個專案標籤來開始組織你的任務</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectTags.map((projectTag) => {
        const progress = calculateProgress(projectTag);
        const isOverdue = new Date() > new Date(projectTag.endDate) && projectTag.status === 'active';
        
        return (
          <div
            key={projectTag.id}
            className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
              isOverdue ? 'border-red-300 bg-red-50' : ''
            } ${
              projectTag.status === 'archived' ? 'opacity-75 bg-gray-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              {/* 左側：專案信息 */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {/* 專案顏色標識 */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: projectTag.color }}
                  />
                  
                                     {/* 專案名稱 */}
                   <h3 className={`text-lg font-semibold ${
                     projectTag.status === 'archived' ? 'text-gray-600' : 'text-gray-900'
                   }`}>
                     {projectTag.name}
                     {projectTag.status === 'archived' && (
                       <span className="ml-2 text-sm font-normal text-gray-500">(已歸檔)</span>
                     )}
                   </h3>
                  
                  {/* 專案類型 */}
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    {getTypeIcon(projectTag.type)}
                    <span>{getTypeLabel(projectTag.type)}</span>
                  </div>
                </div>

                {/* 專案描述 */}
                {projectTag.description && (
                  <p className="text-gray-600 mb-3">{projectTag.description}</p>
                )}

                {/* 專案標籤 */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(projectTag.status)}`}>
                    {projectTag.status === 'active' ? '進行中' : 
                     projectTag.status === 'completed' ? '已完成' : '已歸檔'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityStyle(projectTag.priority)}`}>
                    {projectTag.priority === 'high' ? '高優先級' : 
                     projectTag.priority === 'medium' ? '中優先級' : '低優先級'}
                  </span>
                  {isOverdue && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      已逾期
                    </span>
                  )}
                </div>

                {/* 日期範圍 */}
                <div className="text-sm text-gray-500 mb-3">
                  {formatDate(projectTag.startDate)} - {formatDate(projectTag.endDate)}
                </div>

                {/* 進度條 */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>進度</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress >= 100 ? 'bg-green-500' : 
                        progress >= 75 ? 'bg-blue-500' : 
                        progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 右側：操作按鈕 */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEdit(projectTag)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="編輯專案"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                {projectTag.status === 'active' && (
                  <button
                    onClick={() => onArchive(projectTag.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="歸檔專案"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                
                {projectTag.status === 'archived' && (
                  <button
                    onClick={() => onRestore(projectTag.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="恢復專案"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => onDelete(projectTag.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="刪除專案"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectTagList; 