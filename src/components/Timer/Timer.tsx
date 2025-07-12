import React, { useState, useEffect, useCallback } from 'react';
import { Task, SubTask, PomodoroRecord, AppSettings } from '../../types';
import { generateId, formatTime, isTodaySubTask } from '../../utils/helpers';

interface TimerProps {
  selectedTask: Task | null;
  selectedSubTask: SubTask | null;
  settings: AppSettings;
  onAddRecord: (record: PomodoroRecord) => void;
  onUpdateRecord: (record: PomodoroRecord) => void;
  onTaskUpdate: (task: Task) => void;
  onSubTaskUpdate: (subTask: SubTask) => void;
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
}) => {
  // 計時器狀態
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomodoroDuration * 60); // 秒數
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<PomodoroRecord | null>(null);
  const [mode, setMode] = useState<'work' | 'break'>('work');

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

  // 開始計時
  const startTimer = useCallback(() => {
    const currentTask = selectedSubTask || selectedTask;
    
    if (!currentTask) {
      alert('請先選擇一個任務或子任務');
      return;
    }

    // 檢查是否為當日任務
    if (selectedSubTask && !isTodaySubTask(selectedSubTask)) {
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
  }, [selectedTask, selectedSubTask, settings.pomodoroDuration, onAddRecord]);

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
      if (selectedSubTask) {
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
  }, [currentRecord, selectedTask, selectedSubTask, onUpdateRecord, onTaskUpdate, onSubTaskUpdate, settings.pomodoroDuration]);

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
  }, [selectedTask, settings.pomodoroDuration, isRunning]);

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
      {(selectedTask || selectedSubTask) && (
        <div className="flex-shrink-0 mb-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-1 text-sm">
            {selectedSubTask ? '當前子任務' : '當前任務'}
          </h4>
          <p className="text-sm text-gray-700 truncate">
            {selectedSubTask ? selectedSubTask.name : selectedTask?.name}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-gray-500">
              進度: {selectedSubTask 
                ? `${selectedSubTask.completedPomodoros}/${selectedSubTask.pomodoros}`
                : `${selectedTask?.completedPomodoros}/${selectedTask?.totalPomodoros}`
              }
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div
                className="bg-tomato-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${selectedSubTask 
                    ? (selectedSubTask.completedPomodoros / selectedSubTask.pomodoros) * 100
                    : (selectedTask ? (selectedTask.completedPomodoros / selectedTask.totalPomodoros) * 100 : 0)
                  }%`,
                }}
              ></div>
            </div>
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
                  (!selectedTask && !selectedSubTask) || 
                  (selectedTask ? !isTodayTask(selectedTask) : false) ||
                  (selectedSubTask ? !isTodaySubTask(selectedSubTask) : false)
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
      {!selectedTask && !selectedSubTask && (
        <div className="flex-shrink-0 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            請先選擇一個當日任務或子任務開始計時
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