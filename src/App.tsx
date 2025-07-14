import React, { useState, useEffect } from 'react';
import { Task, SubTask, PomodoroRecord, AppSettings } from './types';
import { isTodaySubTask } from './utils/helpers';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import Calendar from './components/Calendar/Calendar';
import TaskManager from './components/TaskManager/TaskManager';
import Charts from './components/Charts/Charts';
import Timer from './components/Timer/Timer';
import DataManager from './components/UI/DataManager';
import ProjectManager from './components/ProjectManager/ProjectManager';
import Settings from './components/Settings/Settings';
import { MemoManager } from './components/Memo';
import { taskStorage, subTaskStorage, pomodoroStorage, settingsStorage } from './utils/storage';

// 臨時子任務類型
interface TempSubTask {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  pomodoros: number;
  completedPomodoros: number;
  status: 'pending' | 'in-progress' | 'completed';
  scheduledDate: string; // YYYY-MM-DD 格式
  createdAt: Date;
  updatedAt: Date;
}

const App: React.FC = () => {
  // 狀態管理
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'calendar' | 'tasks' | 'projects' | 'charts' | 'data' | 'settings' | 'memos'>('calendar');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  // 數據狀態
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  // 臨時子任務狀態
  const [tempSubTasks, setTempSubTasks] = useState<TempSubTask[]>([]);
  const [pomodoroRecords, setPomodoroRecords] = useState<PomodoroRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    pomodoroDuration: 40,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    notifications: true,
    soundEnabled: true,
    timezone: 'Asia/Taipei',
  });

  // 選擇狀態
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null);

  // 存儲實例已經從 utils/storage 導入

  // 初始化數據
  useEffect(() => {
    const loadData = () => {
      const loadedTasks = taskStorage.getAll();
      const loadedSubTasks = subTaskStorage.getAll();
      const loadedPomodoroRecords = pomodoroStorage.getAll();
      const loadedSettings = settingsStorage.get();

      setTasks(loadedTasks);
      setSubTasks(loadedSubTasks);
      setPomodoroRecords(loadedPomodoroRecords);
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    };

    loadData();
  }, []);

  // 任務管理函數
  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    taskStorage.saveAll(newTasks);
  };

  const updateTask = (updatedTask: Task) => {
    const newTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(newTasks);
    taskStorage.saveAll(newTasks);
  };

  const deleteTask = (taskId: string) => {
    console.log('App deleteTask 調試:', {
      刪除任務ID: taskId,
      當前任務數量: tasks.length,
      當前子任務數量: subTasks.length
    });
    
    // 刪除主任務
    const newTasks = tasks.filter(task => task.id !== taskId);
    setTasks(newTasks);
    taskStorage.saveAll(newTasks);
    
    // 刪除相關的子任務
    const newSubTasks = subTasks.filter(subTask => subTask.parentTaskId !== taskId);
    setSubTasks(newSubTasks);
    subTaskStorage.saveAll(newSubTasks);
    
    console.log('App deleteTask 完成:', {
      更新後任務數量: newTasks.length,
      更新後子任務數量: newSubTasks.length
    });
  };

  // 番茄鐘記錄管理函數
  const addPomodoroRecord = (record: PomodoroRecord) => {
    const newRecords = [...pomodoroRecords, record];
    setPomodoroRecords(newRecords);
    pomodoroStorage.saveAll(newRecords);
  };

  const updatePomodoroRecord = (updatedRecord: PomodoroRecord) => {
    const newRecords = pomodoroRecords.map(record => 
      record.id === updatedRecord.id ? updatedRecord : record
    );
    setPomodoroRecords(newRecords);
    pomodoroStorage.saveAll(newRecords);
  };

  // 子任務管理函數
  const addSubTask = (subTask: SubTask) => {
    console.log('App addSubTask 調試:', {
      新增子任務: subTask,
      當前子任務數量: subTasks.length
    });
    const newSubTasks = [...subTasks, subTask];
    setSubTasks(newSubTasks);
    subTaskStorage.saveAll(newSubTasks);
    console.log('App addSubTask 完成:', {
      更新後子任務數量: newSubTasks.length
    });
  };

  // 批量添加子任務函數
  const addSubTasks = (newSubTasks: SubTask[]) => {
    console.log('App addSubTasks 批量添加調試:', {
      新增子任務數量: newSubTasks.length,
      當前子任務數量: subTasks.length
    });
    const updatedSubTasks = [...subTasks, ...newSubTasks];
    setSubTasks(updatedSubTasks);
    subTaskStorage.saveAll(updatedSubTasks);
    console.log('App addSubTasks 批量添加完成:', {
      更新後子任務數量: updatedSubTasks.length
    });
  };

  const updateSubTask = (updatedSubTask: SubTask) => {
    const newSubTasks = subTasks.map(subTask => 
      subTask.id === updatedSubTask.id ? updatedSubTask : subTask
    );
    setSubTasks(newSubTasks);
    subTaskStorage.saveAll(newSubTasks);
  };

  const deleteSubTask = (subTaskId: string) => {
    const newSubTasks = subTasks.filter(subTask => subTask.id !== subTaskId);
    setSubTasks(newSubTasks);
    subTaskStorage.saveAll(newSubTasks);
  };

  // 臨時子任務管理函數
  const handleTempSubTasksUpdate = (newTempSubTasks: TempSubTask[]) => {
    setTempSubTasks(newTempSubTasks);
  };

  // 設置管理函數
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    settingsStorage.save(newSettings);
  };

  // 檢查任務是否為當日任務
  const isTodayTask = (task: Task): boolean => {
    const today = new Date();
    const startDate = new Date(task.startDate);
    const deadline = new Date(task.deadline);
    
    // 重置時間部分，只比較日期
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    deadline.setHours(23, 59, 59, 999);
    
    // 每日任務 - 檢查是否在有效期間內
    if (task.isDaily) {
      return today >= startDate && today <= deadline;
    }
    
    // 普通任務 - 檢查是否在有效期間內且未完成
    return today >= startDate && today <= deadline && task.status !== 'completed';
  };

  // 任務選擇函數 - 支持選擇任務或子任務
  const handleTaskSelect = (task: Task | null, subTask?: SubTask | null) => {
    if (subTask) {
      // 選擇子任務
      if (!isTodaySubTask(subTask)) {
        alert('只能選擇當日的子任務進行番茄鐘計時');
        return;
      }
      setSelectedSubTask(subTask);
      setSelectedTask(null);
    } else if (task) {
      // 選擇普通任務
      if (!isTodayTask(task)) {
        alert('只能選擇當日的任務進行番茄鐘計時');
        return;
      }
      setSelectedTask(task);
      setSelectedSubTask(null);
    } else {
      // 清除選擇
      setSelectedTask(null);
      setSelectedSubTask(null);
    }
  };

  // 臨時任務選擇函數 - 暫時註釋掉未使用的函數
  // const handleTempSubTaskSelect = (tempSubTask: TempSubTask | null) => {
  //   setSelectedTempSubTask(tempSubTask);
  //   setSelectedTask(null);
  //   setSelectedSubTask(null);
  // };

  // 為TaskManager提供的任務選擇函數
  const handleTaskManagerTaskSelect = (task: Task | null) => {
    setSelectedTask(task);
    setSelectedSubTask(null);
  };

  // 切換側邊欄顯示狀態
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 渲染主內容區域
  const renderMainContent = () => {
    switch (activeView) {
      case 'calendar':
        return (
          <Calendar
            currentDate={currentDate}
            tasks={tasks}
            subTasks={subTasks}
            tempSubTasks={tempSubTasks}
            // pomodoroRecords={pomodoroRecords} // 已移除未使用
            onDateChange={setCurrentDate}
            onTaskSelect={handleTaskSelect}
          />
        );
      case 'tasks':
        return (
          <TaskManager
            tasks={tasks}
            subTasks={subTasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddSubTask={addSubTask}
            onAddSubTasks={addSubTasks}
            onUpdateSubTask={updateSubTask}
            onDeleteSubTask={deleteSubTask}
            selectedTask={selectedTask}
            onTaskSelect={handleTaskManagerTaskSelect}
          />
        );
      case 'charts':
        return (
          <Charts
            tasks={tasks}
            pomodoroRecords={pomodoroRecords}
            currentDate={currentDate}
          />
        );
      case 'projects':
        return <ProjectManager />;
      case 'memos':
        return <MemoManager />;
      case 'data':
        return <DataManager />;
      case 'settings':
        return <Settings settings={settings} onSettingsUpdate={updateSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航欄 */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onToggleSidebar={toggleSidebar}
        activeView={activeView}
        onViewChange={setActiveView}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex min-h-[calc(100vh-4rem)] pt-16">
        {/* 側邊欄 */}
        <Sidebar
          isOpen={isSidebarOpen}
          tasks={tasks}
          subTasks={subTasks}
          pomodoroRecords={pomodoroRecords}
          selectedTask={selectedTask}
          onTaskSelect={handleTaskSelect}
          onViewChange={setActiveView}
        />

        {/* 主內容區域 - 所有頁面都顯示計時器 */}
        <main className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <div className="h-full flex">
            {/* 左側主要內容 - 可滾動 */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderMainContent()}
            </div>

            {/* 右側番茄鐘計時器 - 固定不滾動，所有頁面都顯示 */}
            <div className="w-80 bg-white border-l border-gray-200 p-6 flex-shrink-0 h-[calc(100vh-4rem)] overflow-hidden">
              <Timer
                selectedTask={selectedTask}
                selectedSubTask={selectedSubTask}
                settings={settings}
                onAddRecord={addPomodoroRecord}
                onUpdateRecord={updatePomodoroRecord}
                onTaskUpdate={updateTask}
                onSubTaskUpdate={updateSubTask}
                onTempSubTasksUpdate={handleTempSubTasksUpdate}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App; 