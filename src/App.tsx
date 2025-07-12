import React, { useState, useEffect } from 'react';
import { Task, SubTask, PomodoroRecord, AppSettings } from './types';
import { taskStorage, subTaskStorage, pomodoroStorage, settingsStorage } from './utils/storage';
import { splitTaskIntoSubTasks, isTodaySubTask } from './utils/helpers';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import Calendar from './components/Calendar/Calendar';
import TaskManager from './components/TaskManager/TaskManager';
import Timer from './components/Timer/Timer';
import Charts from './components/Charts/Charts';

/**
 * 主應用組件
 * 負責整體佈局和狀態管理
 */
const App: React.FC = () => {
  // 應用狀態
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [pomodoroRecords, setPomodoroRecords] = useState<PomodoroRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(settingsStorage.defaultSettings());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'calendar' | 'tasks' | 'charts'>('calendar');

  // 初始化數據
  useEffect(() => {
    // 載入本地存儲的數據
    const loadData = () => {
      const savedTasks = taskStorage.getAll();
      const savedSubTasks = subTaskStorage.getAll();
      const savedRecords = pomodoroStorage.getAll();
      const savedSettings = settingsStorage.get();
      
      setTasks(savedTasks);
      setSubTasks(savedSubTasks);
      setPomodoroRecords(savedRecords);
      setSettings(savedSettings);
    };

    loadData();
  }, []);

  // 任務管理函數
  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    taskStorage.saveAll(newTasks);

    // 只要是每日任務就自動產生子任務
    if (task.isDaily) {
      const newSubTasks = splitTaskIntoSubTasks(task);
      console.log('splitTaskIntoSubTasks 產生的每日子任務', newSubTasks);
      if (newSubTasks.length > 0) {
        const updatedSubTasks = [...subTasks, ...newSubTasks];
        setSubTasks(updatedSubTasks);
        subTaskStorage.saveAll(updatedSubTasks);
      }
    }
    // 其餘情況維持 autoSplit 判斷
    else if (task.autoSplit) {
      const newSubTasks = splitTaskIntoSubTasks(task);
      console.log('splitTaskIntoSubTasks 產生的普通子任務', newSubTasks);
      if (newSubTasks.length > 0) {
        const updatedSubTasks = [...subTasks, ...newSubTasks];
        setSubTasks(updatedSubTasks);
        subTaskStorage.saveAll(updatedSubTasks);
      }
    }
  };

  const updateTask = (updatedTask: Task) => {
    const newTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(newTasks);
    taskStorage.saveAll(newTasks);
  };

  const deleteTask = (taskId: string) => {
    const newTasks = tasks.filter(task => task.id !== taskId);
    setTasks(newTasks);
    taskStorage.saveAll(newTasks);
    
    // 刪除相關的子任務
    subTaskStorage.deleteByParentTaskId(taskId);
    const updatedSubTasks = subTasks.filter(subTask => subTask.parentTaskId !== taskId);
    setSubTasks(updatedSubTasks);
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
    const newSubTasks = [...subTasks, subTask];
    setSubTasks(newSubTasks);
    subTaskStorage.saveAll(newSubTasks);
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
            pomodoroRecords={pomodoroRecords}
            onDateChange={setCurrentDate}
            onTaskSelect={handleTaskSelect}
            onTaskUpdate={updateTask}
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

        {/* 主內容區域 */}
        <main className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          {activeView === 'calendar' ? (
            // 月曆頁面：顯示番茄鐘計時器
            <div className="h-full flex">
              {/* 左側主要內容 - 可滾動 */}
              <div className="flex-1 p-6 overflow-y-auto">
                {renderMainContent()}
              </div>

              {/* 右側番茄鐘計時器 - 固定不滾動 */}
              <div className="w-80 bg-white border-l border-gray-200 p-6 flex-shrink-0 h-[calc(100vh-4rem)] overflow-hidden">
                <Timer
                  selectedTask={selectedTask}
                  selectedSubTask={selectedSubTask}
                  settings={settings}
                  onAddRecord={addPomodoroRecord}
                  onUpdateRecord={updatePomodoroRecord}
                  onTaskUpdate={updateTask}
                  onSubTaskUpdate={updateSubTask}
                />
              </div>
            </div>
          ) : (
            // 其他頁面：只顯示主要內容
            <div className="h-full p-6 overflow-y-auto">
              {renderMainContent()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App; 