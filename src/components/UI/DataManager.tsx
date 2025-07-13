import React, { useState, useEffect } from 'react';
import { dataSecurity } from '../../utils/storage';

/**
 * 資料管理組件
 * 提供資料備份、恢復、健康檢查等功能
 */
const DataManager: React.FC = () => {
  const [backups, setBackups] = useState<Array<{key: string, date: string, size: number}>>([]);
  const [dataHealth, setDataHealth] = useState<{isHealthy: boolean, issues: string[]}>({isHealthy: true, issues: []});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 載入備份列表
  const loadBackups = () => {
    const backupList = dataSecurity.getBackupList();
    setBackups(backupList);
  };

  // 檢查資料健康狀況
  const checkHealth = () => {
    const health = dataSecurity.checkDataHealth();
    setDataHealth(health);
  };

  // 修復資料問題
  const repairData = () => {
    if (!confirm('確定要修復資料問題嗎？這將移除孤立的記錄。')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = dataSecurity.repairData();
      setMessage(result.message);
      if (result.repaired) {
        // 重新檢查健康狀況
        setTimeout(() => {
          checkHealth();
          loadBackups();
        }, 1000);
      }
    } catch (error) {
      setMessage('資料修復失敗：' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 手動創建備份
  const createBackup = () => {
    setIsLoading(true);
    try {
      dataSecurity.autoBackup();
      setMessage('備份創建成功！');
      loadBackups();
    } catch (error) {
      setMessage('備份創建失敗：' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 恢復備份
  const restoreBackup = (_backupKey: string) => {
    if (!confirm('確定要恢復這個備份嗎？當前資料將被覆蓋。')) {
      return;
    }

    setIsLoading(true);
    try {
      // 這裡需要實現從特定備份恢復的功能
      const success = dataSecurity.restoreLatestBackup();
      if (success) {
        setMessage('備份恢復成功！請重新整理頁面。');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage('備份恢復失敗！');
      }
    } catch (error) {
      setMessage('備份恢復失敗：' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除備份
  const deleteBackup = (backupKey: string) => {
    if (!confirm('確定要刪除這個備份嗎？')) {
      return;
    }

    try {
      localStorage.removeItem(backupKey);
      setMessage('備份刪除成功！');
      loadBackups();
    } catch (error) {
      setMessage('備份刪除失敗：' + error);
    }
  };

  // 匯出資料
  const exportData = () => {
    try {
      const data = {
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
        subTasks: JSON.parse(localStorage.getItem('subTasks') || '[]'),
        pomodoroRecords: JSON.parse(localStorage.getItem('pomodoroRecords') || '[]'),
        settings: JSON.parse(localStorage.getItem('settings') || '{}'),
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tomato-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('資料匯出成功！');
    } catch (error) {
      setMessage('資料匯出失敗：' + error);
    }
  };

  // 匯入資料
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('確定要匯入資料嗎？當前資料將被覆蓋。')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks));
        if (data.subTasks) localStorage.setItem('subTasks', JSON.stringify(data.subTasks));
        if (data.pomodoroRecords) localStorage.setItem('pomodoroRecords', JSON.stringify(data.pomodoroRecords));
        if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));

        setMessage('資料匯入成功！請重新整理頁面。');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        setMessage('資料匯入失敗：檔案格式錯誤');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    loadBackups();
    checkHealth();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">資料管理</h2>

      {/* 狀態訊息 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('成功') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* 資料健康狀況 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">資料健康狀況</h3>
        <div className={`p-4 rounded-lg ${
          dataHealth.isHealthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              dataHealth.isHealthy ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">
              {dataHealth.isHealthy ? '資料健康' : '發現問題'}
            </span>
          </div>
          {dataHealth.issues.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-1">發現的問題：</p>
              <ul className="list-disc list-inside space-y-1">
                {dataHealth.issues.map((issue, index) => (
                  <li key={index} className="text-red-700">{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={checkHealth}
              className="btn-secondary text-sm"
              disabled={isLoading}
            >
              重新檢查
            </button>
            {!dataHealth.isHealthy && (
              <button
                onClick={repairData}
                className="btn-secondary text-sm bg-orange-100 text-orange-700 hover:bg-orange-200"
                disabled={isLoading}
              >
                修復問題
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 備份管理 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">備份管理</h3>
          <button
            onClick={createBackup}
            className="btn-primary text-sm"
            disabled={isLoading}
          >
            創建備份
          </button>
        </div>
        
        {backups.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            尚無備份
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div key={backup.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(backup.date).toLocaleString('zh-TW')}
                  </div>
                  <div className="text-sm text-gray-500">
                    大小: {(backup.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => restoreBackup(backup.key)}
                    className="btn-secondary text-xs"
                    disabled={isLoading}
                  >
                    恢復
                  </button>
                  <button
                    onClick={() => deleteBackup(backup.key)}
                    className="btn-secondary text-xs bg-red-100 text-red-700 hover:bg-red-200"
                    disabled={isLoading}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 資料匯出/匯入 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">資料匯出/匯入</h3>
        <div className="flex space-x-4">
          <button
            onClick={exportData}
            className="btn-primary text-sm"
            disabled={isLoading}
          >
            匯出資料
          </button>
          <label className="btn-secondary text-sm cursor-pointer">
            匯入資料
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          匯出的檔案包含所有任務、記錄和設定，可用於備份或遷移到其他設備。
        </p>
      </div>

      {/* 注意事項 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">重要提醒</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 定期創建備份以防止資料丟失</li>
          <li>• 匯出的檔案請妥善保管，避免遺失</li>
          <li>• 恢復備份會覆蓋當前所有資料，請謹慎操作</li>
          <li>• 建議在不同設備間定期同步資料</li>
        </ul>
      </div>
    </div>
  );
};

export default DataManager; 