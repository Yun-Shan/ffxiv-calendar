import { EorzeaClock } from './src/time';
import { findNextMoonTime } from './src/moon';
import { findNextWeatherTime, WeatherCond } from './src/weather';

export interface ExtendEorzeaClock extends EorzeaClock {
  formatDateTime(): string;
  getMoonPhase(): string;
  nextMoon(): ReturnType<typeof findNextMoonTime>[0];
  getWeather(locName: string, cache?: boolean): string;
  /**
   * 如果没有天气变化会返回null
   */
  nextWeather(locName: string, cache?: boolean): Required<ReturnType<typeof findNextWeatherTime>>[0] | null;
}

/**
 * 将本地时间转换为艾欧泽亚时间，附带所有时间细节，附带实用工具方法
 *
 * @param {Date=} localDate
 * @return {EorzeaClock}
 */
export function getExtendEorzeaClock(localDate?: Date): ExtendEorzeaClock;

/**
 * 创建一个会自动更新的ET时钟，会自动通过`setTimeout`更新当前时间
 *
 * WARNING: 不用的时候请务必调用stop函数停止更新
 *
 * @param realTimeOffset {number} 用于调整时间偏移使结果更贴近游戏内时间，默认为-480
 * @return {{eorzeaClock: ExtendEorzeaClock, running: boolean, updateCallback?: (clock: ExtendEorzeaClock) => void, stop: () => void}}
 */
export function createAutoClock(realTimeOffset?: number): {
  eorzeaClock: ExtendEorzeaClock;
  running: boolean;
  updateCallback?: (clock: ExtendEorzeaClock) => void;
  stop: () => void;
};

/**
 * 寻找未来的窗口期，如果当前在窗口期中，则返回数组的第一个值会在当前时间之前(即当前窗口期的起始时间)
 *
 * @param {{ etRange?: [number, number], weather?: WeatherCond, loc?: string, moon?: string }} cond 窗口期条件，必须至少有一个条件，其中etRange不能跨天(即必须左值小于右值)，et的取值范围为0000-2400，指定了weather时必须同时指定loc
 * @param {number=} cooldown 冷却时间，冷却时间内即使到了窗口期也不会触发，单位：秒
 * @param {number=} count 要寻找几个窗口期，默认为1
 * @param {Date=} maxLocalDate 最大现实时间，避免找不到窗口期无限循环
 * @param {Date=} now 指定寻找的起始时间，不指定时使用当前时间
 *
 * @return {{date: Date, duration: number}[]} date为时间点，duration为持续时间(单位：毫秒)
 */
export function findNextTimeByCond(
  cond: {
    etRange?: [number, number];
    weather?: WeatherCond;
    loc?: string;
    moon?: string;
  },
  cooldown?: number,
  count?: number, maxLocalDate?: Date | undefined, now?: Date | undefined
): {date: Date, duration: number}[];

export * from './src/time';
export * from './src/weather.js';
export * from './src/moon.js';
