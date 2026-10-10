import { registerPlugin } from "@capacitor/core";

export interface StepCountResult {
  available: boolean; // Health Connect present on this device
  granted?: boolean;
  steps?: number;
}

export interface StepCountPlugin {
  hasPermission(): Promise<{ available: boolean; granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  getTodaySteps(): Promise<StepCountResult>;
}

const StepCount = registerPlugin<StepCountPlugin>("StepCount");

export default StepCount;
