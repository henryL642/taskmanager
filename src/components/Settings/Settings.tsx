import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { settingsStorage } from '../../utils/storage';
import { testSound } from '../../utils/sound';

interface SettingsProps {
  settings: AppSettings;
  onSettingsUpdate: (settings: AppSettings) => void;
}

/**
 * 設定頁面組件
 * 管理應用程式的各種設定，包括時區、番茄鐘時間等
 */
const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);

  // 時區選項
  const timezoneOptions = [
    { value: 'Asia/Taipei', label: '台北 (UTC+8)', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: '東京 (UTC+9)', offset: '+09:00' },
    { value: 'Asia/Shanghai', label: '上海 (UTC+8)', offset: '+08:00' },
    { value: 'Asia/Hong_Kong', label: '香港 (UTC+8)', offset: '+08:00' },
    { value: 'America/New_York', label: '紐約 (UTC-5)', offset: '-05:00' },
    { value: 'America/Los_Angeles', label: '洛杉磯 (UTC-8)', offset: '-08:00' },
    { value: 'Europe/London', label: '倫敦 (UTC+0)', offset: '+00:00' },
    { value: 'Europe/Paris', label: '巴黎 (UTC+1)', offset: '+01:00' },
    { value: 'Australia/Sydney', label: '雪梨 (UTC+10)', offset: '+10:00' },
  ];

  // 當前時區信息
  const currentTimezone = timezoneOptions.find(tz => tz.value === localSettings.timezone) || timezoneOptions[0];
  const currentTime = new Date().toLocaleString('zh-TW', {
    timeZone: localSettings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 處理設定變更
  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setIsDirty(true);
  };

  // 保存設定
  const handleSave = () => {
    onSettingsUpdate(localSettings);
    setIsDirty(false);
  };

  // 重置設定
  const handleReset = () => {
    setLocalSettings(settings);
    setIsDirty(false);
  };

  // 重置為預設設定
  const handleResetToDefault = () => {
    const defaultSettings = settingsStorage.defaultSettings();
    setLocalSettings(defaultSettings);
    setIsDirty(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 標題 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">應用設定</h2>
        <p className="text-gray-600 mt-1">
          自定義你的番茄鐘計時器和應用程式設定
        </p>
      </div>

      {/* 設定表單 */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* 時區設定 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">時區設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇時區
                </label>
                <select
                  value={localSettings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className="input-field w-full"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  當前時區：{currentTimezone.label} | 當前時間：{currentTime}
                </p>
              </div>
            </div>
          </div>

          {/* 番茄鐘設定 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">番茄鐘設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工作時間（分鐘）
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={localSettings.pomodoroDuration}
                  onChange={(e) => handleSettingChange('pomodoroDuration', parseInt(e.target.value) || 25)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  短休息時間（分鐘）
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  長休息時間（分鐘）
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 15)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* 自動化設定 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">自動化設定</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.autoStartBreaks}
                  onChange={(e) => handleSettingChange('autoStartBreaks', e.target.checked)}
                  className="rounded border-gray-300 text-tomato-500 focus:ring-tomato-500"
                />
                <span className="text-sm font-medium text-gray-700">自動開始休息時間</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.autoStartPomodoros}
                  onChange={(e) => handleSettingChange('autoStartPomodoros', e.target.checked)}
                  className="rounded border-gray-300 text-tomato-500 focus:ring-tomato-500"
                />
                <span className="text-sm font-medium text-gray-700">自動開始下一個番茄鐘</span>
              </label>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">通知設定</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="rounded border-gray-300 text-tomato-500 focus:ring-tomato-500"
                />
                <span className="text-sm font-medium text-gray-700">啟用桌面通知</span>
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={localSettings.soundEnabled}
                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-tomato-500 focus:ring-tomato-500"
                  />
                  <span className="text-sm font-medium text-gray-700">啟用聲音提醒</span>
                </label>
                <button
                  onClick={testSound}
                  className="text-sm text-tomato-600 hover:text-tomato-700 px-3 py-1 border border-tomato-300 rounded-md hover:bg-tomato-50 transition-colors"
                >
                  測試音效
                </button>
              </div>
            </div>
          </div>

          {/* 數據管理 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">數據管理</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">數據備份</p>
                  <p className="text-xs text-gray-500">自動備份你的任務和番茄鐘記錄</p>
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  已啟用
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const data = localStorage.getItem('tomato_timer_data');
                    if (data) {
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `tomato_timer_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  匯出數據
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const data = e.target?.result as string;
                            localStorage.setItem('tomato_timer_data', data);
                            alert('數據匯入成功！請刷新頁面。');
                          } catch (error) {
                            alert('數據匯入失敗，請檢查文件格式。');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  匯入數據
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={handleResetToDefault}
            className="btn-secondary text-sm px-4 py-2"
          >
            重置為預設
          </button>
          <button
            onClick={handleReset}
            disabled={!isDirty}
            className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消變更
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="btn-primary text-sm px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          儲存設定
        </button>
      </div>
    </div>
  );
};

export default Settings; 