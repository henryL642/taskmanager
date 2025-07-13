/**
 * 音效工具函數
 * 提供番茄鐘計時相關的音效播放功能
 */

// 音效類型定義
export type SoundType = 'pomodoro-complete' | 'break-start' | 'break-complete' | 'notification';

// 音效配置
interface SoundConfig {
  volume: number; // 音量 (0-1)
  enabled: boolean; // 是否啟用音效
}

// 預設音效配置
const defaultConfig: SoundConfig = {
  volume: 0.7,
  enabled: true,
};

// 音效檔案 URL（使用 Web Audio API 生成音效）
// 注意：此函數目前未使用，保留作為備用方案
// const generateBeepSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine'): string => {
//   const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
//   const oscillator = audioContext.createOscillator();
//   const gainNode = audioContext.createGain();
//   
//   oscillator.connect(gainNode);
//   gainNode.connect(audioContext.destination);
//   
//   oscillator.frequency.value = frequency;
//   oscillator.type = type;
//   
//   // 音量包絡
//   gainNode.gain.setValueAtTime(0, audioContext.currentTime);
//   gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
//   gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
//   
//   oscillator.start(audioContext.currentTime);
//   oscillator.stop(audioContext.currentTime + duration);
//   
//   return 'generated';
// };

// 音效播放類
class SoundPlayer {
  private config: SoundConfig;
  private audioContext: AudioContext | null = null;

  constructor(config: SoundConfig = defaultConfig) {
    this.config = config;
    this.initAudioContext();
  }

  // 初始化音頻上下文
  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('無法初始化音頻上下文:', error);
    }
  }

  // 播放音效
  async playSound(type: SoundType): Promise<void> {
    if (!this.config.enabled || !this.audioContext) {
      return;
    }

    try {
      // 恢復音頻上下文（如果被暫停）
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      switch (type) {
        case 'pomodoro-complete':
          this.playPomodoroComplete();
          break;
        case 'break-start':
          this.playBreakStart();
          break;
        case 'break-complete':
          this.playBreakComplete();
          break;
        case 'notification':
          this.playNotification();
          break;
      }
    } catch (error) {
      console.warn('播放音效失敗:', error);
    }
  }

  // 播放番茄鐘完成音效
  private playPomodoroComplete() {
    if (!this.audioContext) return;

    // 播放三聲提示音
    this.playBeep(800, 0.3, 0);
    this.playBeep(1000, 0.3, 0.4);
    this.playBeep(1200, 0.5, 0.8);
  }

  // 播放休息開始音效
  private playBreakStart() {
    if (!this.audioContext) return;

    // 播放兩聲較柔和的提示音
    this.playBeep(600, 0.2, 0);
    this.playBeep(800, 0.3, 0.3);
  }

  // 播放休息完成音效
  private playBreakComplete() {
    if (!this.audioContext) return;

    // 播放一聲較長的提示音
    this.playBeep(1000, 0.8);
  }

  // 播放通知音效
  private playNotification() {
    if (!this.audioContext) return;

    // 播放一聲簡短的提示音
    this.playBeep(1000, 0.2);
  }

  // 播放單個音調
  private playBeep(frequency: number, duration: number, delay: number = 0) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    const startTime = this.audioContext.currentTime + delay;
    const endTime = startTime + duration;
    
    // 音量包絡
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.config.volume * 0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
    
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }

  // 更新配置
  updateConfig(config: Partial<SoundConfig>) {
    this.config = { ...this.config, ...config };
  }

  // 設置音量
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  // 啟用/禁用音效
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
  }

  // 測試音效
  async testSound(): Promise<void> {
    await this.playSound('notification');
  }
}

// 創建全局音效播放器實例
let soundPlayer: SoundPlayer | null = null;

// 獲取音效播放器實例
export const getSoundPlayer = (): SoundPlayer => {
  if (!soundPlayer) {
    soundPlayer = new SoundPlayer();
  }
  return soundPlayer;
};

// 播放音效的便捷函數
export const playSound = async (type: SoundType): Promise<void> => {
  const player = getSoundPlayer();
  await player.playSound(type);
};

// 更新音效配置
export const updateSoundConfig = (config: Partial<SoundConfig>): void => {
  const player = getSoundPlayer();
  player.updateConfig(config);
};

// 設置音量
export const setSoundVolume = (volume: number): void => {
  const player = getSoundPlayer();
  player.setVolume(volume);
};

// 啟用/禁用音效
export const setSoundEnabled = (enabled: boolean): void => {
  const player = getSoundPlayer();
  player.setEnabled(enabled);
};

// 測試音效
export const testSound = async (): Promise<void> => {
  const player = getSoundPlayer();
  await player.testSound();
};

export default SoundPlayer; 