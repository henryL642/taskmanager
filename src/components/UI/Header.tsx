import React from 'react';
import { Calendar, List, BarChart3, Database, Target, Menu, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { formatDateLocal } from '../../utils/helpers';

interface HeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onToggleSidebar: () => void;
  activeView: 'calendar' | 'tasks' | 'projects' | 'charts' | 'data' | 'settings';
  onViewChange: (view: 'calendar' | 'tasks' | 'projects' | 'charts' | 'data' | 'settings') => void;
  isSidebarOpen: boolean;
}

/**
 * 頂部導航欄組件
 * 包含日期導航、視圖切換和側邊欄控制
 */
const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onToggleSidebar,
  activeView,
  onViewChange,
  isSidebarOpen,
}) => {
  // 切換到上個月
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  // 切換到下個月
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  // 切換到今天
  const goToToday = () => {
    onDateChange(new Date());
  };

  // 視圖切換按鈕
  const viewButtons = [
    {
      id: 'calendar' as const,
      label: '月曆',
      icon: Calendar,
      description: '查看月曆視圖',
    },
    {
      id: 'tasks' as const,
      label: '任務',
      icon: List,
      description: '管理任務列表',
    },
    {
      id: 'projects' as const,
      label: '專案',
      icon: Target,
      description: '管理專案標籤',
    },
    {
      id: 'charts' as const,
      label: '統計',
      icon: BarChart3,
      description: '查看統計圖表',
    },
    {
      id: 'data' as const,
      label: '資料',
      icon: Database,
      description: '管理資料備份',
    },
    {
      id: 'settings' as const,
      label: '設定',
      icon: Settings,
      description: '應用程式設定',
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* 左側：側邊欄切換和日期導航 */}
        <div className="flex items-center space-x-4">
          {/* 側邊欄切換按鈕 */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isSidebarOpen ? '隱藏側邊欄' : '顯示側邊欄'}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* 日期導航 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="上個月"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900">
                {formatDateLocal(currentDate).split(' ')[0]} {currentDate.getFullYear()}
              </h1>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-tomato-500 text-white rounded-lg hover:bg-tomato-600 transition-colors"
              >
                今天
              </button>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="下個月"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 右側：視圖切換 */}
        <div className="flex items-center space-x-1">
          {viewButtons.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === id
                  ? 'bg-tomato-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={description}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header; 