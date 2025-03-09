export interface EorzeaClock {
  localTime: number;
  localTimeDate: Date;
  eorzeaTime: number;
  eorzeaTimeDate: Date;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  monthName: string;
  monthElement: string;
  dayElement: string;
  hourElement: string;
}

/**
 * 将本地时间转换为艾欧泽亚时间，附带所有时间细节
 *
 * @param localDate {Date}
 * @return {EorzeaClock}
 */
export function calcEorzeaClock(localDate?: Date): EorzeaClock;

/**
 * ET转LT，输出类型取决于输入类型
 *
 * @template {Date | number} T
 * @param date {T}
 * @return {T}
 */
export function eorzeaTimeToLocal<T extends Date | number>(date: T): T;

/**
 * LT转ET，输出类型取决于输入类型
 *
 * @template {Date | number} T
 * @param date {T}
 * @return {T}
 */
export function localTimeToEorzea<T extends Date | number>(date: T): T;

/**
 * 格式化ET为HH:mm的形式
 *
 * @param eTime {Date}
 * @return {string}
 */
export function formatET(eTime: Date): string;

/**
 * 格式化时/分
 *
 * @param hour {number}
 * @param minute {number}
 * @return {string}
 */
export function formatTime(hour: number, minute: number): string;

/**
 * 格式化艾欧泽亚时钟
 *
 * @param clock {EorzeaClock}
 * @return {string}
 */
export function formatEorzeaClock(clock: EorzeaClock): string;

export const eorzeaRatio: number;
