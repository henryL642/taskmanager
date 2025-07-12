import React, { useState, useEffect, useCallback } from 'react';
import { Task, SubTask, PomodoroRecord, AppSettings } from '../../types';
import { generateId, formatTime, isTodaySubTask } from '../../utils/helpers';

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

interface TimerProps {
  selectedTask: Task | null;
  selectedSubTask: SubTask | null;
  settings: AppSettings;
  onAddRecord: (record: PomodoroRecord) => void;
  onUpdateRecord: (record: PomodoroRecord) => void;
  onTaskUpdate: (task: Task) => void;
  onSubTaskUpdate: (subTask: SubTask) => void;
  onTempSubTasksUpdate?: (tempSubTasks: TempSubTask[]) => void;
}

/**
 * 番茄鐘計時器組件
 * 提供40分鐘工作週期的計時功能
 */
const Timer: React.FC<TimerProps> = ({
  selectedTask,
  selectedSubTask,
  settings,
  onAddRecord,
  onUpdateRecord,
  onTaskUpdate,
  onSubTaskUpdate,
  onTempSubTasksUpdate,
}) => {
  // 計時器狀態
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomodoroDuration * 60); // 秒數
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<PomodoroRecord | null>(null);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  // 臨時子任務狀態
  const [tempSubTasks, setTempSubTasks] = useState<TempSubTask[]>([]);
  const [selectedTempSubTask, setSelectedTempSubTask] = useState<TempSubTask | null>(null);
  const [showTempTaskForm, setShowTempTaskForm] = useState<boolean>(false);
  const [tempTaskForm, setTempTaskForm] = useState({
    name: '',
    shortName: '',
    description: '',
    pomodoros: 1,
  });

  // 格式化顯示時間
  const displayTime = formatTime(timeLeft);

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

  // 檢查臨時子任務是否為當日任務
  const isTodayTempSubTask = (tempSubTask: TempSubTask): boolean => {
    const today = new Date();
    const taskDate = new Date(tempSubTask.scheduledDate);
    
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === taskDate.getTime();
  };

  // 創建臨時子任務
  const createTempSubTask = () => {
    if (!tempTaskForm.name.trim()) {
      alert('請輸入任務名稱');
      return;
    }

    if (!tempTaskForm.shortName.trim()) {
      alert('請輸入任務簡稱');
      return;
    }

    const today = new Date();
    const newTempSubTask: TempSubTask = {
      id: generateId(),
      name: tempTaskForm.name,
      shortName: tempTaskForm.shortName.substring(0, 2),
      description: tempTaskForm.description,
      pomodoros: tempTaskForm.pomodoros,
      completedPomodoros: 0,
      status: 'pending',
      scheduledDate: today.toISOString().split('T')[0],
      createdAt: today,
      updatedAt: today,
    };

    setTempSubTasks(prev => {
      const newTempSubTasks = [...prev, newTempSubTask];
      // 通知父組件臨時子任務已更新
      if (onTempSubTasksUpdate) {
        onTempSubTasksUpdate(newTempSubTasks);
      }
      return newTempSubTasks;
    });
    setSelectedTempSubTask(newTempSubTask);
    setShowTempTaskForm(false);
    setTempTaskForm({
      name: '',
      shortName: '',
      description: '',
      pomodoros: 1,
    });
  };

  // 更新臨時子任務
  const updateTempSubTask = (updatedTempSubTask: TempSubTask) => {
    setTempSubTasks(prev => {
      const newTempSubTasks = prev.map(task => 
        task.id === updatedTempSubTask.id ? updatedTempSubTask : task
      );
      // 通知父組件臨時子任務已更新
      if (onTempSubTasksUpdate) {
        onTempSubTasksUpdate(newTempSubTasks);
      }
      return newTempSubTasks;
    });
  };

  // 開始計時
  const startTimer = useCallback(() => {
    const currentTask = selectedTempSubTask || selectedSubTask || selectedTask;
    
    if (!currentTask) {
      alert('請先選擇一個任務或子任務');
      return;
    }

    // 檢查是否為當日任務
    if (selectedTempSubTask && !isTodayTempSubTask(selectedTempSubTask)) {
      alert('只能選擇當日的臨時子任務進行番茄鐘計時');
      return;
    } else if (selectedSubTask && !isTodaySubTask(selectedSubTask)) {
      alert('只能選擇當日的子任務進行番茄鐘計時');
      return;
    } else if (selectedTask && !isTodayTask(selectedTask)) {
      alert('只能選擇當日的任務進行番茄鐘計時');
      return;
    }

    // 創建新的番茄鐘記錄
    const newRecord: PomodoroRecord = {
      id: generateId(),
      taskId: currentTask.id,
      startTime: new Date(),
      duration: settings.pomodoroDuration,
      status: 'active',
    };

    setCurrentRecord(newRecord);
    onAddRecord(newRecord);
    setIsRunning(true);
    setIsPaused(false);
    setMode('work');
  }, [selectedTask, selectedSubTask, selectedTempSubTask, settings.pomodoroDuration, onAddRecord]);

  // 暫停計時
  const pauseTimer = useCallback(() => {
    if (currentRecord) {
      const updatedRecord: PomodoroRecord = {
        ...currentRecord,
        status: 'paused',
      };
      setCurrentRecord(updatedRecord);
      onUpdateRecord(updatedRecord);
    }
    setIsPaused(true);
  }, [currentRecord, onUpdateRecord]);

  // 恢復計時
  const resumeTimer = useCallback(() => {
    if (currentRecord) {
      const updatedRecord: PomodoroRecord = {
        ...currentRecord,
        status: 'active',
      };
      setCurrentRecord(updatedRecord);
      onUpdateRecord(updatedRecord);
    }
    setIsPaused(false);
  }, [currentRecord, onUpdateRecord]);

  // 停止計時
  const stopTimer = useCallback(() => {
    if (currentRecord) {
      const updatedRecord: PomodoroRecord = {
        ...currentRecord,
        endTime: new Date(),
        status: 'completed',
      };
      setCurrentRecord(updatedRecord);
      onUpdateRecord(updatedRecord);

      // 更新任務或子任務進度
      if (selectedTempSubTask) {
        const updatedTempSubTask: TempSubTask = {
          ...selectedTempSubTask,
          completedPomodoros: selectedTempSubTask.completedPomodoros + 1,
          updatedAt: new Date(),
        };
        updateTempSubTask(updatedTempSubTask);
      } else if (selectedSubTask) {
        const updatedSubTask: SubTask = {
          ...selectedSubTask,
          completedPomodoros: selectedSubTask.completedPomodoros + 1,
          updatedAt: new Date(),
        };
        onSubTaskUpdate(updatedSubTask);
      } else if (selectedTask) {
        const updatedTask: Task = {
          ...selectedTask,
          completedPomodoros: selectedTask.completedPomodoros + 1,
          updatedAt: new Date(),
        };
        onTaskUpdate(updatedTask);
      }
    }

    setIsRunning(false);
    setIsPaused(false);
    setCurrentRecord(null);
    setTimeLeft(settings.pomodoroDuration * 60);
    setMode('work');
  }, [currentRecord, selectedTask, selectedSubTask, selectedTempSubTask, onUpdateRecord, onTaskUpdate, onSubTaskUpdate, settings.pomodoroDuration]);

  // 重置計時器
  const resetTimer = useCallback(() => {
    if (currentRecord) {
      const updatedRecord: PomodoroRecord = {
        ...currentRecord,
        endTime: new Date(),
        status: 'completed',
      };
      onUpdateRecord(updatedRecord);
    }

    setIsRunning(false);
    setIsPaused(false);
    setCurrentRecord(null);
    setTimeLeft(settings.pomodoroDuration * 60);
    setMode('work');
  }, [currentRecord, onUpdateRecord, settings.pomodoroDuration]);

  // 計時器邏輯
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 時間到
            if (mode === 'work') {
              // 工作時間結束，開始休息
              setMode('break');
              return settings.shortBreakDuration * 60;
            } else {
              // 休息時間結束
              stopTimer();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, timeLeft, mode, settings.shortBreakDuration, stopTimer]);

  // 當選擇的任務改變時重置計時器
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(settings.pomodoroDuration * 60);
      setMode('work');
    }
  }, [selectedTask, selectedSubTask, selectedTempSubTask, settings.pomodoroDuration, isRunning]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 標題 */}
      <div className="flex-shrink-0 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">番茄鐘計時器</h3>
        <p className="text-sm text-gray-600 mt-1">
          {mode === 'work' ? '專注工作時間' : '休息時間'}
        </p>
      </div>

      {/* 選中的任務或子任務 */}
      {(selectedTask || selectedSubTask || selectedTempSubTask) && (
        <div className="flex-shrink-0 mb-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-1 text-sm">
            {selectedTempSubTask ? '當前臨時任務' : selectedSubTask ? '當前子任務' : '當前任務'}
          </h4>
          <p className="text-sm text-gray-700 truncate">
            {selectedTempSubTask ? selectedTempSubTask.name : 
             selectedSubTask ? selectedSubTask.name : selectedTask?.name}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-gray-500">
              進度: {selectedTempSubTask 
                ? `${selectedTempSubTask.completedPomodoros}/${selectedTempSubTask.pomodoros}`
                : selectedSubTask 
                ? `${selectedSubTask.completedPomodoros}/${selectedSubTask.pomodoros}`
                : `${selectedTask?.completedPomodoros}/${selectedTask?.totalPomodoros}`
              }
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div
                className="bg-tomato-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${selectedTempSubTask 
                    ? (selectedTempSubTask.completedPomodoros / selectedTempSubTask.pomodoros) * 100
                    : selectedSubTask 
                    ? (selectedSubTask.completedPomodoros / selectedSubTask.pomodoros) * 100
                    : (selectedTask ? (selectedTask.completedPomodoros / selectedTask.totalPomodoros) * 100 : 0)
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 臨時任務快速創建 */}
      <div className="flex-shrink-0 mb-3">
        <button
          onClick={() => setShowTempTaskForm(true)}
          className="w-full btn-primary text-sm py-2"
        >
          ➕ 新增臨時任務
        </button>
      </div>

      {/* 臨時任務表單 */}
      {showTempTaskForm && (
        <div className="flex-shrink-0 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">新增臨時任務</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="任務名稱"
              value={tempTaskForm.name}
              onChange={(e) => setTempTaskForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="簡稱（最多2字）"
              value={tempTaskForm.shortName}
              onChange={(e) => setTempTaskForm(prev => ({ ...prev, shortName: e.target.value }))}
              onBlur={(e) => {
                const value = e.target.value;
                if (value.length > 2) {
                  setTempTaskForm(prev => ({ ...prev, shortName: value.substring(0, 2) }));
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <textarea
              placeholder="描述（可選）"
              value={tempTaskForm.description}
              onChange={(e) => setTempTaskForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
              rows={2}
            />
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">番茄鐘數:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={tempTaskForm.pomodoros}
                onChange={(e) => setTempTaskForm(prev => ({ ...prev, pomodoros: parseInt(e.target.value) || 1 }))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createTempSubTask}
                className="flex-1 btn-primary text-xs py-1"
              >
                創建並開始
              </button>
              <button
                onClick={() => setShowTempTaskForm(false)}
                className="flex-1 btn-secondary text-xs py-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 今日臨時任務列表 */}
      {tempSubTasks.length > 0 && (
        <div className="flex-shrink-0 mb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">今日臨時任務</h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {tempSubTasks
              .filter(task => isTodayTempSubTask(task))
              .map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTempSubTask(task)}
                  className={`p-2 rounded text-xs cursor-pointer transition-colors border-l-2 border-orange-400 ${
                    selectedTempSubTask?.id === task.id
                      ? 'bg-orange-50 text-orange-700 border-orange-500'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{task.shortName}</span>
                    <span className="text-xs ml-1">
                      {task.completedPomodoros}/{task.pomodoros}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 計時器顯示 - 固定高度 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="text-center">
          {/* 時間顯示 */}
          <div className={`text-4xl font-mono font-bold mb-2 ${
            mode === 'work' ? 'text-tomato-500' : 'text-green-500'
          }`}>
            {displayTime}
          </div>

          {/* 模式指示器 */}
          <div className="mb-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              mode === 'work'
                ? 'bg-tomato-100 text-tomato-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {mode === 'work' ? '🍅 工作時間' : '☕ 休息時間'}
            </span>
          </div>

          {/* 控制按鈕 */}
          <div className="flex items-center justify-center space-x-2">
            {!isRunning ? (
              <button
                onClick={startTimer}
                disabled={
                  (!selectedTask && !selectedSubTask && !selectedTempSubTask) || 
                  (selectedTask ? !isTodayTask(selectedTask) : false) ||
                  (selectedSubTask ? !isTodaySubTask(selectedSubTask) : false) ||
                  (selectedTempSubTask ? !isTodayTempSubTask(selectedTempSubTask) : false)
                }
                className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                開始
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="btn-primary px-5 py-2 text-sm"
                  >
                    繼續
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="btn-secondary px-5 py-2 text-sm"
                  >
                    暫停
                  </button>
                )}
                <button
                  onClick={stopTimer}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  完成
                </button>
              </>
            )}
          </div>

          {/* 重置按鈕 */}
          {isRunning && (
            <button
              onClick={resetTimer}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              重置計時器
            </button>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      {!selectedTask && !selectedSubTask && !selectedTempSubTask && (
        <div className="flex-shrink-0 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            請先選擇一個當日任務或子任務開始計時，或新增臨時任務
          </p>
        </div>
      )}

      {/* 非當日任務提示 */}
      {selectedTask && !isTodayTask(selectedTask) && (
        <div className="flex-shrink-0 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800 text-center">
            只能選擇當日的任務進行番茄鐘計時
          </p>
        </div>
      )}

      {/* 非當日子任務提示 */}
      {selectedSubTask && !isTodaySubTask(selectedSubTask) && (
        <div className="flex-shrink-0 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800 text-center">
            只能選擇當日的子任務進行番茄鐘計時
          </p>
        </div>
      )}

      {/* 非當日臨時子任務提示 */}
      {selectedTempSubTask && !isTodayTempSubTask(selectedTempSubTask) && (
        <div className="flex-shrink-0 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800 text-center">
            只能選擇當日的臨時任務進行番茄鐘計時
          </p>
        </div>
      )}

      {/* 設置信息 */}
      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-900 mb-1">計時器設置</h4>
        <div className="space-y-0.5 text-xs text-gray-600">
          <div>工作時間: {settings.pomodoroDuration} 分鐘</div>
          <div>短休息: {settings.shortBreakDuration} 分鐘</div>
          <div>長休息: {settings.longBreakDuration} 分鐘</div>
        </div>
      </div>
    </div>
  );
};

export default Timer; 