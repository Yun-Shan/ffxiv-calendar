import locDataByName from '../data/locDataByName.json' with { type: 'json' };
import { eorzeaTimeToLocal, localTimeToEorzea } from './time.js';

// 代码参考自 https://garlandtools.cn/db/js/gt.js 略作修改

/**
 * @typedef {string | { whitelist?: string[], blacklist?: string[], sequences?: string[][] }} WeatherCond
 */

const allLocations = [...new Set(Object.keys(locDataByName))]
  .filter(it => !/^[0-9]+$/.test(it))
  .sort((a, b) => a.localeCompare(b));

/**
 * 获取所有可用的地点名称列表
 *
 * @return {string[]}
 */
export function getAllowLocations() {
  return allLocations;
}

const FALLBACK_WEATHER = '晴朗';

/**
 * 用于制作固定天气的地点的查询结果
 *
 * @param {string} weatherName
 * @param {Date} now
 * @param {'next' | 'prev'} nextOrPrev
 * @param {number} count
 * @param {boolean} useCurrent
 * @return {{ date: Date, weather: string }[]}
 */
function buildSameWeatherTime(weatherName, now, nextOrPrev, count, useCurrent) {
  const eTime = getWeatherInterval(localTimeToEorzea(now));
  /** @type {{ date: Date, weather: string }[]} */
  const result = [];
  if (useCurrent) result.push({ date: eorzeaTimeToLocal(eTime), weather: weatherName });
  while (result.length < count) {
    eTime.setUTCHours(eTime.getUTCHours() + (nextOrPrev === 'next' ? 8 : -8));
    result.push({ date: eorzeaTimeToLocal(eTime), weather: weatherName });
  }
  return result;
}

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

/**
 * 计算指定的本地时间的指定地点的天气
 *
 * @param localDate {Date}
 * @param locName {string}
 * @return {string} 天气名称
 */
export function forecastWeather(localDate, locName) {
  const loc = locDataByName[locName];
  if (!loc || !loc.weatherRate) return FALLBACK_WEATHER;
  if (loc.weatherRate.length === 1) return loc.weatherRate[0].weather;

  const forecastTarget = calculateForecastTarget(localDate);
  const rate = loc.weatherRate.find(r => forecastTarget < r.rate);
  if (!rate) throw new Error('无法找到指定时间的天气，该错误不应该出现，可能是天气数据有问题');
  return rate.weather;
}

/**
 * 获得上一次天气变化的ET时间
 *
 * @param eDate {(Date | number)=} 指定ET时间，不指定则使用当前时间
 * @return {Date} 上一次天气变化的ET时间
 */
export function getWeatherInterval(eDate) {
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
 * @param weatherCond {WeatherCond | undefined} 指定需要查找的天气条件，不指定时接受所有天气
 * @param nextOrPrev {'next' | 'prev'} 往前还是往后查找
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[]} count数量的天气起始时间点(本地时间)，如果直到untilLocalDate还找不够的话结果数量会小于count
 */
function findWeatherTime(
  localDate, locName, weatherCond, nextOrPrev, count = 1, untilLocalDate
) {
  const loc = locDataByName[locName];
  // 对无天气或只有一个天气的地点特殊处理
  if (!loc?.weatherRate || loc.weatherRate.length < 2) {
    const allowWeather = (loc?.weatherRate ? loc.weatherRate[0]?.weather : undefined) || FALLBACK_WEATHER;
    if (!weatherCond) return buildSameWeatherTime(allowWeather, localDate, nextOrPrev, count, false);
    let checkPass = false;
    if (typeof weatherCond === 'string') {
      checkPass = weatherCond === allowWeather;
    } else if (
      (weatherCond.whitelist && weatherCond.whitelist.includes(allowWeather))
      || (weatherCond.blacklist && !weatherCond.blacklist.includes(allowWeather))
      || (weatherCond.sequences && weatherCond.sequences.length === 1 && weatherCond.sequences[0]?.length === 1 && weatherCond.sequences[0][0] === allowWeather)
    ) {
      checkPass = true;
    }
    return checkPass ? buildSameWeatherTime(allowWeather, localDate, nextOrPrev, count, true) : [];
  }
  /** @type {((weatherName: string, eTime: Date) => boolean) | undefined} */
  let weatherChecker;
  if (weatherCond) {
    if (typeof weatherCond === 'string') {
      if (!loc.weatherRate.some(it => it.weather === weatherCond)) return [];
      weatherChecker = (weatherName) => weatherName === weatherCond;
    } else {
      const allowWeathers = new Set(loc.weatherRate.map(it => it.weather));
      if (weatherCond.whitelist && weatherCond.whitelist.length > 0) {
        const set = new Set(weatherCond.whitelist);
        if (allowWeathers.intersection(set).size === 0) return [];
        weatherChecker = (weatherName) => set.has(weatherName);
      } else if (weatherCond.blacklist && weatherCond.blacklist.length > 0) {
        const set = new Set(weatherCond.blacklist);
        if (allowWeathers.difference(set).size === 0) return [];
        weatherChecker = (weatherName) => !set.has(weatherName);
      } else if (weatherCond.sequences && weatherCond.sequences.length > 0) {
        if (weatherCond.sequences.length === 1) {
          if (!loc.weatherRate.some(it => it.weather === weatherCond.sequences[0])) return [];
          weatherChecker = (weatherName) => weatherName === weatherCond.sequences[0];
        } else {
          const validSequences = weatherCond.sequences.filter(it => !it.some(s => !allowWeathers.has(s)));
          if (validSequences.length === 0) return [];
          weatherChecker = (weatherName, eTime) => {
            return validSequences.some(seq => {
              const et = new Date(eTime);
              for (let i = seq.length - 1; i >= 0; i--) {
                const seqWeather = seq[i];
                if (seqWeather !== weatherName) return false;
                et.setUTCHours(et.getUTCHours() - 8);
                weatherName = forecastWeather(eorzeaTimeToLocal(et), locName);
              }
              return true;
            })
          };
        }
      } else {
        weatherCond = undefined;
      }
    }
  }
  const eTime = getWeatherInterval(localTimeToEorzea(localDate));

  /** @type {{ date: Date, weather: string }[]} */
  const result = [];

  if (!untilLocalDate) {
    untilLocalDate = new Date(localDate);
    // 最多往前/后查找一年现实时间
    untilLocalDate.setUTCFullYear(untilLocalDate.getUTCFullYear() + (nextOrPrev === 'next' ? 1 : -1));
  }
  const untilEt = localTimeToEorzea(untilLocalDate.getTime());
  const checkEt = nextOrPrev === 'next' ? (() => eTime.getTime() <= untilEt) : (() => eTime.getTime() >= untilEt);
  while (checkEt() && count-- > 0) {
    /** @type {string} */
    let curWeather;
    // 指定天气时从当前时间开始找(因为这时候是希望看到尽可能早的目标天气时间)，不指定天气时直接偏移时间再确认天气(因为这时候是希望看到偏移后的天气)
    if (weatherCond) {
      let found = false;
      while (checkEt()) {
        curWeather = forecastWeather(eorzeaTimeToLocal(eTime), locName);
        if (weatherChecker(curWeather, eTime)) {
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
 * @param weatherCond {WeatherCond=} 指定需要查找的天气条件，不指定时接受所有天气
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[]} count数量的天气起始时间点(本地时间)，如果直到untilLocalDate还找不够的话结果数量会小于count
 */
export function findNextWeatherTime(localDate, locName, weatherCond, count = 1, untilLocalDate) {
  return findWeatherTime(localDate, locName, weatherCond, 'next', count, untilLocalDate);
}

/**
 * 查找以前的天气时间
 *
 * @param localDate {Date} 当前时间，用作起始点往以前查找
 * @param locName {string} 指定需要查找的地点
 * @param weatherCond {WeatherCond=} 指定需要查找的天气条件，不指定时接受所有天气
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[]}  count数量的天气起始时间点(本地时间)，如果直到untilLocalDate还找不够的话结果数量会小于count
 */
export function findPrevWeatherTime(localDate, locName, weatherCond, count = 1, untilLocalDate) {
  return findWeatherTime(localDate, locName, weatherCond, 'prev', count, untilLocalDate);
}

