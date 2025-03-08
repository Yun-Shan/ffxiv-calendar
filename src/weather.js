import locDataByName from '../data/locDataByName.json' with { type: 'json' };
import { eorzeaTimeToLocal, localTimeToEorzea } from './time.js';

// 代码参考自 https://garlandtools.cn/db/js/gt.js 略作修改

/**
 * 计算指定的本地时间对应的天气数值
 *
 * @param localDate {Date}
 * @return {number} 天气数值
 */
function calculateForecastTarget(localDate) {
  // Thanks to Rogueadyn's SaintCoinach library for this calculation.

  const unixSeconds = Math.floor(localDate.getTime() / 1000);
  // Get Eorzea hour for weather start
  const bell = unixSeconds / 175;

  // Do the magic 'cause for calculations 16:00 is 0, 00:00 is 8 and 08:00 is 16
  const increment = (bell + 8 - (bell % 8)) % 24;

  // Take Eorzea days since unix epoch
  let totalDays = unixSeconds / 4200;
  // 无法理解为什么要左移32位，也不知道去掉有什么影响(考虑到js的number类型比较神奇，如果是long和int反复横跳的话也不是完全无法理解(但也有可能是其它语言复制过来的没改？))
  // noinspection ShiftOutOfRangeJS
  totalDays = (totalDays << 32) >>> 0; // uint

  // 0x64 = 100
  const calcBase = totalDays * 100 + increment;

  // 0xB = 11
  const step1 = ((calcBase << 11) ^ calcBase) >>> 0; // uint
  const step2 = ((step1 >>> 8) ^ step1) >>> 0; // uint

  // 0x64 = 100
  return step2 % 100;
}

// TODO 所有查天气相关函数需要兼容所有地点的天气，无天气变化的要返回对应的固定天气，只有找不到地点的才返回空值

/**
 * 计算指定的本地时间的指定地点的天气
 *
 * @param localDate {Date}
 * @param locName {string}
 * @return {string | null} 天气名称，目标区域没有天气变化时返回null
 */
export function forecastWeather(localDate, locName) {
  const loc = locDataByName[locName];
  if (!loc || !loc.weatherRate) return null;

  const forecastTarget = calculateForecastTarget(localDate);
  const rate = loc.weatherRate.find(r => forecastTarget < r.rate);
  return rate?.weather ?? null;
}

/**
 * 获得上一次天气变化的ET时间
 *
 * @param eDate {Date=} 指定ET时间，不指定则使用当前时间
 * @return {Date} 上一次天气变化的ET时间
 */
function getWeatherInterval(eDate) {
  const eWeather = eDate ? new Date(eDate) : localTimeToEorzea(new Date());
  eWeather.setUTCHours(Math.floor(eWeather.getUTCHours() / 8) * 8);
  eWeather.setUTCMinutes(0);
  eWeather.setUTCSeconds(0);
  return eWeather;
}

/**
 * 查找天气时间
 *
 * @param localDate {Date} 当前时间，用作起始点往前/后查找
 * @param locName {string} 指定需要查找的地点
 * @param weatherName {string | undefined} 指定需要查找的天气，不指定时接受所有天气
 * @param nextOrPrev {'next' | 'prev'} 往前还是往后查找
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[] | null} count数量的天气起始时间点(本地时间)，地点不存在或指定天气没有天气变化或指定地点没有指定天气时返回null
 */
function findWeatherTime(
  localDate, locName, weatherName, nextOrPrev, count = 1, untilLocalDate
) {
  const loc = locDataByName[locName];
  if (!loc?.weatherRate) return null;
  if (weatherName && !loc.weatherRate.some(it => it.weather === weatherName)) return null;
  const eTime = getWeatherInterval(localTimeToEorzea(localDate));

  /** @type {{ date: Date, weather: string }[]} */
  const result = [];

  if (!untilLocalDate) {
    untilLocalDate = new Date(localDate);
    // 最多往前/后查找一年现实时间
    untilLocalDate.setUTCFullYear(untilLocalDate.getUTCFullYear() + (nextOrPrev === 'next' ? 1 : -1));
  }
  const untilEt = localTimeToEorzea(untilLocalDate).getTime();
  const checkEt = nextOrPrev === 'next' ? (() => eTime.getTime() <= untilEt) : (() => eTime.getTime() >= untilEt);
  while (checkEt() && count-- > 0) {
    /** @type {string} */
    let curWeather;
    // 指定天气时从当前时间开始找(因为这时候是希望看到尽可能早的目标天气时间)，不指定天气时直接偏移时间再确认天气(因为这时候是希望看到偏移后的天气)
    if (weatherName) {
      let found = false;
      while (checkEt()) {
        curWeather = forecastWeather(eorzeaTimeToLocal(eTime), locName);
        if (curWeather === weatherName) {
          result.push({ date: eorzeaTimeToLocal(eTime), weather: curWeather });
          eTime.setUTCHours(eTime.getUTCHours() + (nextOrPrev === 'next' ? 8 : -8));
          found = true;
          break;
        }
        eTime.setUTCHours(eTime.getUTCHours() + (nextOrPrev === 'next' ? 8 : -8));
      }
      // 如果是时间查完了导致的跳出循环，则不继续后续循环
      if (!found) break;
    } else {
      eTime.setUTCHours(eTime.getUTCHours() + (nextOrPrev === 'next' ? 8 : -8));
      curWeather = forecastWeather(eorzeaTimeToLocal(eTime), locName);
      result.push({ date: eorzeaTimeToLocal(eTime), weather: curWeather });
    }
  }
  return result;
}

/**
 * 查找未来的天气时间
 *
 * @param localDate {Date} 当前时间，用作起始点往未来查找
 * @param locName {string} 指定需要查找的地点
 * @param weatherName {string=} 指定需要查找的天气，不指定时接受所有天气
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[] | null} count数量的天气起始时间点(本地时间)，地点不存在或指定天气没有天气变化或指定地点没有指定天气时返回null
 */
export function findNextWeatherTime(localDate, locName, weatherName, count = 1, untilLocalDate) {
  return findWeatherTime(localDate, locName, weatherName, 'next', count, untilLocalDate);
}

/**
 * 查找以前的天气时间
 *
 * @param localDate {Date} 当前时间，用作起始点往以前查找
 * @param locName {string} 指定需要查找的地点
 * @param weatherName {string=} 指定需要查找的天气，不指定时接受所有天气
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[] | null} count数量的天气起始时间点(本地时间)，地点不存在或指定天气没有天气变化或指定地点没有指定天气时返回null
 */
export function findPrevWeatherTime(localDate, locName, weatherName, count = 1, untilLocalDate) {
  return findWeatherTime(localDate, locName, weatherName, 'prev', count, untilLocalDate);
}

