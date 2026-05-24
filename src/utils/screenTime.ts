import { registerPlugin } from "@capacitor/core";

export interface AppUsage {
  appName: string;
  packageName: string;
  timeMs: number;
}

export interface ScreenTimeResult {
  hasPermission: boolean;
  totalMs?: number;
  apps?: AppUsage[];
}

export interface ScreenTimePlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  getScreenTime(): Promise<ScreenTimeResult>;
}

const ScreenTime = registerPlugin<ScreenTimePlugin>("ScreenTime");

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default ScreenTime;
