export const eorzeaRatio = (60 * 24) / 70; // 1地球日=70艾欧泽亚分钟

const monthNames = ['星1', '灵1', '星2', '灵2', '星3', '灵3', '星4', '灵4', '星5', '灵5', '星6', '灵6'];
const monthElements = ['冰', '冰', '水', '水', '风', '风', '雷', '雷', '火', '火', '土', '土'];
const dayElements = ['风', '雷', '火', '土', '冰', '水', '星', '灵'];
const hourElements = [
  '风', '雷', '火', '土', '冰', '水',
  '风', '雷', '火', '土', '冰', '水',
  '风', '雷', '火', '土', '冰', '水',
  '风', '雷', '火', '土', '冰', '水'
];

export const DEFAULT_REAL_TIME_OFFSET = -480;

/*
 * export interface EorzeaClock {
 *     localTime: Date;
 *     eorzeaTime: Date;
 *     month: number;
 *     day: number;
 *     hour: number;
 *     minute: number;
 *     second: number;
 *     millisecond: number;
 *     monthName: string;
 *     monthElement: string;
 *     dayElement: string;
 *     hourElement: string;
 * }
 */

/**
 * 将本地时间转换为艾欧泽亚时间，附带所有时间细节
 *
 * @param localDate {Date}
 * @return {EorzeaClock}
 */
export function calcEorzeaClock(localDate = new Date(Date.now() + DEFAULT_REAL_TIME_OFFSET)) {
  // 代码参考魂晶计算器，https://ff14db.games.sina.com.cn/index.html
  // 在魂晶计算器的基础上略作优化(去除了无法理解的艾欧泽亚起始时间，修改时间偏移(放在了createAutoClock中))
  const et = localTimeToEorzea(localDate);
  let timeOffset = et.getTime();
  const eorzeaMs = timeOffset % 1000;
  timeOffset = (timeOffset - eorzeaMs) / 1000;
  const eorzeaSecond = timeOffset % 60;
  timeOffset = (timeOffset - eorzeaSecond) / 60;
  const eorzeaMinute = timeOffset % 60;
  timeOffset = (timeOffset - eorzeaMinute) / 60;
  const eorzeaHour = timeOffset % 24;
  timeOffset = (timeOffset - eorzeaHour) / 24;
  const eorzeaDay = timeOffset % 32; // 艾欧泽亚一个月固定32天
  timeOffset = (timeOffset - eorzeaDay) / 32;
  const eorzeaMonth = timeOffset % 12;
  // 如果要算年的话就得有对应的起始时间，但是由于玩家主线不同步的问题，游戏里实际上不存在年(即设定上应当有，但是实际上不会使用)
  // timeOffset = (timeOffset - eorzeaMonth) / 12;
  // const eorzeaYear = timeOffset;

  return  {
    localTime: localDate,
    eorzeaTime: et,
    month: eorzeaMonth + 1,
    day: eorzeaDay + 1,
    hour: eorzeaHour,
    minute: eorzeaMinute,
    second: eorzeaSecond,
    millisecond: eorzeaMs,
    monthName: monthNames[eorzeaMonth],
    monthElement: monthElements[eorzeaMonth],
    dayElement: dayElements[eorzeaDay % 8],
    hourElement: hourElements[eorzeaHour],
  }
}

/**
 * ET转LT
 *
 * @param date {Date}
 * @return {Date}
 */
export function eorzeaTimeToLocal(date) {
  return new Date(date.getTime() / eorzeaRatio);
}

/**
 * LT转ET
 *
 * @param date {Date}
 * @return {Date}
 */
export function localTimeToEorzea(date) {
  return new Date(date.getTime() * eorzeaRatio);
}

/**
 * 格式化ET为HH:mm的形式
 *
 * @param eTime {Date}
 * @return {string}
 */
export function formatET(eTime) {
  return formatTime(eTime.getUTCHours(), eTime.getUTCMinutes());
}

/**
 * 格式化时/分
 *
 * @param hour {number}
 * @param minute {number}
 * @return {string}
 */
export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * 格式化艾欧泽亚时钟
 *
 * @param clock {EorzeaClock}
 * @return {string}
 */
export function formatEorzeaClock(clock) {
  return `${clock.monthName}月 ${clock.day}日(${clock.dayElement}属日) ${formatTime(clock.hour, clock.minute)}(${clock.hourElement}属时)`;
}
