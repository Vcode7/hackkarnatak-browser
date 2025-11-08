/**
 * Platform detection utilities
 */

export const isElectron = () => {
  return !!(window.electron || window.process?.type === 'renderer' || 
    window.navigator.userAgent.toLowerCase().includes('electron'));
};

export const isCapacitor = () => {
  return !!(window.Capacitor);
};

export const isWeb = () => {
  return !isElectron() && !isCapacitor();
};

export const getPlatform = () => {
  if (isElectron()) return 'electron';
  if (isCapacitor()) return 'capacitor';
  return 'web';
};

export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const getOS = () => {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) return 'macos';
  if (iosPlatforms.indexOf(platform) !== -1) return 'ios';
  if (windowsPlatforms.indexOf(platform) !== -1) return 'windows';
  if (/Android/.test(userAgent)) return 'android';
  if (/Linux/.test(platform)) return 'linux';

  return 'unknown';
};
