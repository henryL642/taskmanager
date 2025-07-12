import React from 'react';
import { Task, PomodoroRecord } from '../../types';
import { getDaysInMonth, getPomodorosForDate, calculateTaskProgress } from '../../utils/helpers';

interface ChartsProps {
  tasks: Task[];
  pomodoroRecords: PomodoroRecord[];
  currentDate: Date;
}

/**
 * 統計圖表組件
 * 顯示任務進度、每日番茄鐘趨勢和任務排行
 */
const Charts: React.FC<ChartsProps> = ({
  tasks,
  pomodoroRecords,
  currentDate,
}) => {
  // 獲取當月的所有日期
  const daysInMonth = getDaysInMonth(currentDate);
  
  // 過濾當前月份的日期
  const currentMonthDays = daysInMonth.filter(date => 
    date.getMonth() === currentDate.getMonth() && 
    date.getFullYear() === currentDate.getFullYear()
  );

  // 計算每日番茄鐘數據
  const dailyPomodorosData = currentMonthDays.map(date => ({
    date: date.toDateString(),
    pomodoros: getPomodorosForDate(pomodoroRecords, date),
  }));

  // 計算任務進度數據
  const taskProgressData = tasks
    .filter(task => task.status !== 'completed')
    .map(task => ({
      name: task.name,
      progress: calculateTaskProgress(task),
      totalPomodoros: task.totalPomodoros,
      completedPomodoros: task.completedPomodoros,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 10); // 只顯示前10個任務

  // 計算任務排行數據
  const taskRankingData = tasks
    .map(task => {
      const taskRecords = pomodoroRecords.filter(record => record.taskId === task.id);
      return {
        name: task.name,
        totalPomodoros: taskRecords.length,
        completedPomodoros: taskRecords.filter(r => r.status === 'completed').length,
        totalTime: taskRecords.reduce((total, record) => total + record.duration, 0),
      };
    })
    .sort((a, b) => b.totalPomodoros - a.totalPomodoros)
    .slice(0, 8); // 只顯示前8個任務

  // 統計概覽
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalPomodoros: pomodoroRecords.filter(r => r.status === 'completed').length,
    totalFocusTime: pomodoroRecords
      .filter(r => r.status === 'completed')
      .reduce((total, record) => total + record.duration, 0),
    averageDailyPomodoros: dailyPomodorosData.reduce((sum, day) => sum + day.pomodoros, 0) / currentMonthDays.length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* 標題 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">統計分析</h2>
        <p className="text-gray-600 mt-1">
          查看你的任務進度和番茄鐘使用趨勢
        </p>
      </div>

      {/* 統計概覽卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
          <div className="text-sm text-gray-600">總任務數</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
          <div className="text-sm text-gray-600">已完成任務</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-tomato-600">{stats.totalPomodoros}</div>
          <div className="text-sm text-gray-600">總番茄鐘數</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{Math.round(stats.averageDailyPomodoros)}</div>
          <div className="text-sm text-gray-600">日均番茄鐘</div>
        </div>
      </div>

      {/* 圖表區域 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任務進度圖表 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">任務進度</h3>
          <div className="space-y-3">
            {taskProgressData.map((task, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 truncate">{task.name}</span>
                  <span className="text-sm text-gray-600">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-tomato-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {task.completedPomodoros} / {task.totalPomodoros} 番茄鐘
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 每日番茄鐘趨勢 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日番茄鐘趨勢</h3>
          <div className="space-y-2">
            {dailyPomodorosData.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-16">
                  {new Date(day.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.max(day.pomodoros * 10, 5)}%`,
                      minWidth: '4px'
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">
                  {day.pomodoros}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 任務排行 */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">任務排行</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taskRankingData.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-tomato-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate">{task.name}</div>
                    <div className="text-sm text-gray-600">
                      {task.totalPomodoros} 個番茄鐘
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {Math.round(task.totalTime / 60)} 小時
                  </div>
                  <div className="text-xs text-gray-500">
                    完成率 {task.totalPomodoros > 0 ? Math.round((task.completedPomodoros / task.totalPomodoros) * 100) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 詳細統計信息 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 專注時間統計 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">專注時間統計</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">總專注時間</span>
              <span className="font-medium">{Math.round(stats.totalFocusTime / 60)} 小時</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均每次專注</span>
              <span className="font-medium">{stats.totalPomodoros > 0 ? Math.round(stats.totalFocusTime / stats.totalPomodoros) : 0} 分鐘</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">完成率</span>
              <span className="font-medium">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 月度趨勢 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月度趨勢</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">本月番茄鐘</span>
              <span className="font-medium">{dailyPomodorosData.reduce((sum, day) => sum + day.pomodoros, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最高單日</span>
              <span className="font-medium">
                {Math.max(...dailyPomodorosData.map(day => day.pomodoros))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">活躍天數</span>
              <span className="font-medium">
                {dailyPomodorosData.filter(day => day.pomodoros > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts; 