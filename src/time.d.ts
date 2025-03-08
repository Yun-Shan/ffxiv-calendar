export interface EorzeaClock {
    localTime: Date;
    eorzeaTime: Date;
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
 * 创建一个会自动更新的ET时钟，会自动通过`setTimeout`更新当前时间
 *
 * WARNING: 不用的时候请务必调用stop函数停止更新
 *
 * @param realTimeOffset {number} 用于调整时间偏移使结果更贴近游戏内时间，默认为-480
 * @return {{eorzeaClock: EorzeaClock, running: boolean, updateCallback?: (EorzeaClock) => void, stop: () => void}}
 */
export function createAutoClock(realTimeOffset?: number): {
    eorzeaClock: EorzeaClock;
    running: boolean;
    updateCallback?: (EorzeaClock: any) => void;
    stop: () => void;
};

/**
 * ET转LT
 *
 * @param date {Date}
 * @return {Date}
 */
export function eorzeaTimeToLocal(date: Date): Date;

/**
 * LT转ET
 *
 * @param date {Date}
 * @return {Date}
 */
export function localTimeToEorzea(date: Date): Date;

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
