import {
  calcEorzeaClock,
  DEFAULT_REAL_TIME_OFFSET,
  eorzeaRatio,
  eorzeaTimeToLocal,
  formatEorzeaClock,
  localTimeToEorzea
} from './src/time.js';
import { calcMoonPhase, findNextMoonTime } from './src/moon.js';
import { findNextWeatherTime, forecastWeather, getWeatherInterval } from './src/weather.js';

export * from './src/time.js';
export * from './src/weather.js';
export * from './src/moon.js';

/**
 * 将本地时间转换为艾欧泽亚时间，附带所有时间细节，附带实用工具方法
 *
 * @param {Date=} localDate
 * @return {ExtendEorzeaClock}
 */
export function getExtendEorzeaClock(localDate = new Date(Date.now() + DEFAULT_REAL_TIME_OFFSET)) {
  /** @type {ExtendEorzeaClock & Record<string, unknown>} */
  const extendClock = {
    ...calcEorzeaClock(localDate),
    formatDateTime() {
      return formatEorzeaClock(extendClock);
    },
    getMoonPhase() {
      if (extendClock._moonPhase) return extendClock._moonPhase;
      extendClock._moonPhase = calcMoonPhase(extendClock.eorzeaTime).moon;
      return extendClock._moonPhase;
    },
    nextMoon() {
      if (extendClock._nextMoon) return extendClock._nextMoon;
      extendClock._nextMoon = findNextMoonTime(extendClock.localTime)[0];
      return extendClock._nextMoon;
    },
    _weather: {},
    _nextWeather: {},
    getWeather(locName, cache = true) {
      if (!cache) return forecastWeather(localDate, locName);
      if (extendClock._weather[locName]) return extendClock._weather[locName];
      extendClock._weather[locName] = forecastWeather(localDate, locName);
      return extendClock._weather[locName];
    },
    nextWeather(locName, cache = true) {
      if (!cache) return findNextWeatherTime(localDate, locName);
      if (extendClock._nextWeather[locName] !== undefined) return extendClock._nextWeather[locName];
      const nextWeatherResult = findNextWeatherTime(localDate, locName, { blacklist: [extendClock.getWeather(locName)] });
      extendClock._nextWeather[locName] = nextWeatherResult ? (nextWeatherResult[0] ?? null) : null;
      return extendClock._nextWeather[locName];
    }
  }
  return extendClock;
}

/**
 * 创建一个会自动更新的ET时钟，会自动通过`setTimeout`更新当前时间
 *
 * WARNING: 不用的时候请务必调用stop函数停止更新
 *
 * @param realTimeOffset {number} 用于调整时间偏移使结果更贴近游戏内时间，默认为-480
 * @return {{eorzeaClock: EorzeaClock, running: boolean, updateCallback?: (clock: EorzeaClock) => void, stop: () => void}}
 */
export function createAutoClock(realTimeOffset = DEFAULT_REAL_TIME_OFFSET) {
  // 把魂晶计算器的减20571艾欧泽亚毫秒改为了减480本地毫秒，体感更贴近游戏时间变动(但仍然不能完全贴合，仍有明显偏移，由于偏移量在变化找不到更合适的值，希望有人能找出来)
  // 需要注意的是我们并不清楚为什么要微调时间，怀疑极有可能是时钟同步的问题
  let timeout;
  const ret = {
    eorzeaClock: getExtendEorzeaClock(new Date()),
    running: true,
    updateCallback: undefined,
    stop: () => {
      ret.running = false;
      if (timeout) clearTimeout(timeout);
    }
  };
  const updateTime = () => {
    if (!ret.running) return;
    const now = new Date(Date.now() + realTimeOffset);
    const oldClock = ret.eorzeaClock;
    ret.eorzeaClock = getExtendEorzeaClock(now);
    // 复制缓存 减少重复计算
    if (oldClock.hour === ret.eorzeaClock.hour) {
      ret.eorzeaClock._moonPhase = oldClock._moonPhase;
      ret.eorzeaClock._nextMoon = oldClock._nextMoon;
      ret.eorzeaClock._weather = oldClock._weather;
      ret.eorzeaClock._nextWeather = oldClock._nextWeather;
    }

    // nextEorzeaMinute as local ms
    const nextEorzeaMinute = (60_000 - (ret.eorzeaClock.second * 1000 + ret.eorzeaClock.millisecond)) / eorzeaRatio;
    timeout = setTimeout(() => updateTime(), nextEorzeaMinute);
    if (typeof ret.updateCallback === 'function') {
      ret.updateCallback(ret.eorzeaClock);
    }
  };
  updateTime();

  return ret;
}

function getEtNumber(hour, minute, allow2400 = false) {
  if (allow2400) {
    return (Math.floor(hour % 24) || 24) * 100 + minute;
  } else {
    return hour * 100 + minute;
  }
}

/**
 * 在指定的天气列表中过滤符合指定ET的天气
 * @param weathers {{ date: Date; weather: string }[]}
 * @param etRange {[number, number]=}
 */
function getFilterWeathers(
  weathers,
  etRange,
) {
  return weathers
    .map(it => {
      const clock = calcEorzeaClock(it.date);
      const etStart = getEtNumber(clock.hour, clock.minute);
      const etEnd = getEtNumber(clock.hour + 8, clock.minute, true);
      if (etRange[1] > etStart && etRange[0] < etEnd) {
        if (etStart >= etRange[0]) return it;
        else {
          const hourOffset = (Math.floor(etRange[0] / 100) - Math.floor(etStart / 100)) * 60 * 60 * 1000;
          const minuteOffset = (Math.floor(etRange[0] % 100) - Math.floor(etStart % 100)) * 60 * 1000;
          return {
            date: eorzeaTimeToLocal(new Date(clock.eorzeaTime + hourOffset + minuteOffset)),
            weather: it.weather,
          };
        }
      }
    })
    .filter(it => !!it);
}

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
  cond,
  cooldown = 0,
  count = 1,
  maxLocalDate,
  now,
) {
  cooldown = cooldown > 0 ? cooldown * 1000 : 0;
  /** @type {{ date: Date, duration: number }[]} */
  let finalResult = [];
  let timeOffset = now ?? new Date();
  let lastTime = 0;
  while (finalResult.length < count) {
    const rawResult = findNextTimeByCondWithoutCD(cond, count, maxLocalDate, timeOffset);
    const filteredResult = rawResult.reduce((acc, curr) => {
      if ((curr.date.getTime() + curr.duration) < timeOffset.getTime()) {
        return acc;
      }
      if ((curr.date.getTime() - lastTime) > cooldown) {
        lastTime = curr.date.getTime();
        let mergeWindow = false;
        if (acc.length > 0) {
          const last = acc[acc.length - 1];
          if (last.date.getTime() + last.duration === curr.date.getTime()) {
            last.duration += curr.duration;
            mergeWindow = true;
          }
        }
        if (!mergeWindow) acc.push(curr);
      }
      return acc;
    }, []);
    finalResult.push(...filteredResult);
    // 原始查询为0的话就是找不到了
    if (rawResult.length === 0) {
      break;
    }
    timeOffset = new Date(finalResult[finalResult.length - 1].date.getTime() + 1000);
  }
  return finalResult.slice(0, count);
}

/**
 * 寻找未来的窗口期，不考虑CD，如果当前在窗口期中，则返回数组的第一个值会在当前时间之前(即当前窗口期的起始时间)
 *
 * @param {{ etRange?: [number, number], weather?: WeatherCond, loc?: string, moon?: string }} cond 窗口期条件，必须至少有一个条件，其中etRange不能跨天(即必须左值小于右值)，et的取值范围为0000-2400，指定了weather时必须同时指定loc
 * @param {number=} count 要寻找几个窗口期，默认为1
 * @param {Date=} maxLocalDate 最大现实时间，避免找不到窗口期无限循环
 * @param {Date=} now 指定寻找的起始时间，不指定时使用当前时间
 *
 * @return {{date: Date, duration: number}[]} date为时间点，duration为持续时间(单位：毫秒)
 */
function findNextTimeByCondWithoutCD(
  cond,
  count = 1,
  maxLocalDate,
  now,
) {
  if (!cond.etRange && !cond.weather && !cond.moon) throw new Error('empty cond');
  if (cond.weather && !cond.loc) throw new Error('must specify a loc when specify weather');
  if (cond.etRange && (cond.etRange[0] < 0 || cond.etRange[0] >= cond.etRange[1] || cond.etRange[1] > 2400)) throw new Error('invalid etRange');
  if (!now) now = new Date();
  if (!maxLocalDate) {
    maxLocalDate = new Date(now);
    maxLocalDate.setUTCFullYear(maxLocalDate.getUTCFullYear() + 1);
  }
  /** @type {(Date) => number} */
  const getWeatherEndLocalTime = (date) => {
    const et = getWeatherInterval(localTimeToEorzea(date));
    et.setUTCHours(et.getUTCHours() + 8);
    return eorzeaTimeToLocal(et.getTime());
  };
  if (!cond.etRange) {
    if (cond.weather && cond.moon) {
      const loc = cond.loc;
      /** @type {{date: Date, duration: number}[]} */
      const result = [];
      let dateOffset = now;
      while (count > 0 && maxLocalDate.getTime() > dateOffset.getTime()) {
        const nextMoonStartLocalDate = findNextMoonTime(dateOffset, cond.moon, count, maxLocalDate)[0].date;
        const nextMoonEndLocalDate = new Date(Math.round(
          eorzeaTimeToLocal(
            localTimeToEorzea(nextMoonStartLocalDate.getTime()) + 4 * 24 * 60 * 60 * 1000
          )
        ));
        dateOffset = new Date(nextMoonEndLocalDate.getTime() + 1000);
        const weathers = findNextWeatherTime(nextMoonStartLocalDate, loc, cond.weather, count, nextMoonEndLocalDate);
        if (weathers) {
          result.push(...weathers.map(it => {
            const weatherEndTime = getWeatherEndLocalTime(it.date);
            const endTime = Math.min(weatherEndTime, nextMoonEndLocalDate.getTime());
            return { date: it.date, duration: Math.round(endTime - it.date.getTime()) };
          }));
          count -= weathers.length;
        }
      }
      return result;
    } else if (cond.weather) {
      const loc = cond.loc;
      return findNextWeatherTime(now, loc, cond.weather, count, maxLocalDate)
        ?.map(it => ({ date: it.date, duration: Math.round(eorzeaTimeToLocal(8 * 60 * 60 * 1000)) }));
    } else if (cond.moon) {
      return findNextMoonTime(now, cond.moon, count, maxLocalDate)
        .map(it => ({ date: it.date, duration: Math.round(eorzeaTimeToLocal(4 * 24 * 60 * 60 * 1000)) }));
    }
  } else {
    /** @type {(ExtendEorzeaClock) => number} */
    const getEtRangeEndLocalTime = (clock) => {
      const endETHour = Math.floor(cond.etRange[1] / 100);
      const endETMinute = Math.floor(cond.etRange[1] % 100);
      const ms = ((endETHour - clock.hour) * 60 + (endETMinute - clock.minute)) * 60 * 1000;
      return eorzeaTimeToLocal(clock.eorzeaTime + ms);
    };
    if (cond.weather && cond.moon) {
      const loc = cond.loc;
      /** @type {{date: Date, duration: number}[]} */
      const result = [];
      let dateOffset = now;
      while (count > 0 && maxLocalDate.getTime() > dateOffset.getTime()) {
        const nextMoonStartLocalDate = findNextMoonTime(dateOffset, cond.moon, count, maxLocalDate)[0].date;
        const nextMoonEndLocalDate = new Date(Math.round(
          eorzeaTimeToLocal(
            localTimeToEorzea(nextMoonStartLocalDate.getTime()) + 4 * 24 * 60 * 60 * 1000
          )
        ));
        if (nextMoonStartLocalDate.getTime() < now.getTime()) {
          nextMoonStartLocalDate.setTime(now.getTime());
        }
        dateOffset = new Date(nextMoonEndLocalDate.getTime() + 1000);
        const weathers = findNextWeatherTime(nextMoonStartLocalDate, loc, cond.weather, count, nextMoonEndLocalDate);
        if (weathers && weathers.length > 0) {
          const filterWeathers = getFilterWeathers(weathers, cond.etRange);
          if (filterWeathers.length > 0) {
            result.push(...filterWeathers.map(it => {
              const weatherEndTime = getWeatherEndLocalTime(it.date);
              const etEndTime = getEtRangeEndLocalTime(calcEorzeaClock(it.date));
              const endTime = Math.min(weatherEndTime, etEndTime, nextMoonEndLocalDate.getTime());
              return { date: it.date, duration: Math.round(endTime - it.date.getTime()) };
            }));
            count -= filterWeathers.length;
          }
        }
      }
      return result;
    } else if (cond.weather) {
      const loc = cond.loc;
      if ((findNextWeatherTime(now, loc, cond.weather)?.length ?? 0) < 1) return []; // 快速失败 确保这个地点可以找到指定天气
      /** @type {{date: Date, duration: number}[]} */
      const result = [];
      let dateOffset = now;
      while (count > 0 && maxLocalDate.getTime() > dateOffset.getTime()) {
        /**
         * 因为前面进行了一次快速失败测试，所以这里一定是有结果的
         * @type {{date: Date, weather: string}[]}
         */
        const weathers = findNextWeatherTime(dateOffset, loc, cond.weather, count, maxLocalDate);
        dateOffset = localTimeToEorzea(weathers[weathers.length - 1].date);
        dateOffset.setUTCHours(dateOffset.getUTCHours() + 8);
        dateOffset = eorzeaTimeToLocal(new Date(dateOffset.getTime() + 1000));
        const filterWeathers = getFilterWeathers(weathers, cond.etRange);
        if (filterWeathers.length > 0) {
          result.push(...filterWeathers.map(it => {
            const weatherEndTime = getWeatherEndLocalTime(it.date);
            const etEndTime = getEtRangeEndLocalTime(calcEorzeaClock(it.date));
            const endTime = Math.min(weatherEndTime, etEndTime);
            return { date: it.date, duration: Math.round(endTime - it.date.getTime()) };
          }));
          count -= filterWeathers.length;
        }
      }
      return result;
    } else if (cond.moon) {
      /** @type {{date: Date, duration: number}[]} */
      const result = [];
      let dateOffset = now;
      while (count > 0 && maxLocalDate.getTime() > dateOffset.getTime()) {
        const nextMoonStartLocalDate = findNextMoonTime(dateOffset, cond.moon, count)[0].date;
        const nextMoonEndLocalDate = new Date(Math.round(
          eorzeaTimeToLocal(
            localTimeToEorzea(nextMoonStartLocalDate.getTime()) + 4 * 24 * 60 * 60 * 1000
          )
        ));
        dateOffset = new Date(nextMoonEndLocalDate.getTime() + 1000);
        const nowEorzea = localTimeToEorzea(now);
        const clock = calcEorzeaClock(nextMoonStartLocalDate);
        // 把时间规整到月相起始日的ET时间
        let etOffset = clock.eorzeaTime;
        etOffset -= clock.millisecond;
        etOffset -= clock.second * 1000;
        etOffset -= clock.minute * 60 * 1000;
        // 值得注意的是，GarlandTools对月相的计算是按中午12点切换的，但不确定游戏内具体是几点切换
        // 为了代码写起来方便，这里把12点归回0点，但是这会导致月相起始日的et0000-et1200的数据可能有问题
        // 如果在只有et和moon的条件下计算结果和游戏内实际不符，可以考虑是这个的问题
        etOffset -= clock.hour * 60 * 60 * 1000;
        etOffset += Math.floor(cond.etRange[0] / 100) * 60 * 60 * 1000 + Math.floor(cond.etRange[0] % 100) * 60 * 1000;
        let etRangeStart = etOffset;
        etOffset += Math.floor(cond.etRange[1] / 100) * 60 * 60 * 1000 + Math.floor(cond.etRange[1] % 100) * 60 * 1000;
        let etRangeEnd = etOffset;
        while (etRangeEnd <= nowEorzea.getTime()) {
          etRangeStart += 24 * 60 * 60 * 1000;
          etRangeEnd += 24 * 60 * 60 * 1000;
        }
        while (etRangeStart < nextMoonEndLocalDate.getTime()) {
          if (etRangeStart > nextMoonStartLocalDate.getTime() && etRangeEnd < nextMoonEndLocalDate.getTime()) {
            const date = eorzeaTimeToLocal(new Date(etRangeStart));
            result.push({ date: date, duration: Math.round(eorzeaTimeToLocal(etRangeEnd - etRangeStart)) });
            count--;
          } else if (etRangeStart < nextMoonStartLocalDate.getTime() && etRangeEnd > nextMoonStartLocalDate.getTime()) {
            result.push({
              date: nextMoonStartLocalDate,
              duration: Math.round(eorzeaTimeToLocal(etRangeEnd - localTimeToEorzea(nextMoonStartLocalDate.getTime())))
            });
            count--;
          } else if (etRangeStart < nextMoonEndLocalDate.getTime() && etRangeEnd > nextMoonEndLocalDate.getTime()) {
            const date = eorzeaTimeToLocal(etRangeStart);
            result.push({
              date: new Date(date),
              duration: Math.round(eorzeaTimeToLocal(localTimeToEorzea(nextMoonEndLocalDate) - etRangeStart))
            });
            count--;
          }
          etRangeStart += 24 * 60 * 60 * 1000;
          etRangeEnd += 24 * 60 * 60 * 1000;
        }
      }
      return result;
    } else {
      /** @type {{date: Date, duration: number}[]} */
      const result = [];
      const clock = calcEorzeaClock(now);
      // 把时间规整到当前日的指定ET时间
      let etOffset = clock.eorzeaTime;
      etOffset -= clock.millisecond;
      etOffset -= clock.second * 1000;
      etOffset -= clock.minute * 60 * 1000;
      etOffset -= clock.hour * 60 * 60 * 1000;
      etOffset += Math.floor(cond.etRange[0] / 100) * 60 * 60 * 1000 + Math.floor(cond.etRange[0] % 100) * 60 * 1000;
      let etRangeStart = etOffset;
      etOffset += Math.floor(cond.etRange[1] / 100) * 60 * 60 * 1000 + Math.floor(cond.etRange[1] % 100) * 60 * 1000;
      let etRangeEnd = etOffset;
      while (etRangeEnd <= clock.eorzeaTime) {
        etRangeStart += 24 * 60 * 60 * 1000;
        etRangeEnd += 24 * 60 * 60 * 1000;
      }
      const maxET = localTimeToEorzea(maxLocalDate.getTime())
      while (count > 0 && maxET > etRangeStart) {
        const date = eorzeaTimeToLocal(new Date(etRangeStart));
        result.push({ date: date, duration: Math.round(eorzeaTimeToLocal(etRangeEnd - etRangeStart)) });
        count--;
        etRangeStart += 24 * 60 * 60 * 1000;
        etRangeEnd += 24 * 60 * 60 * 1000;
      }
      return result;
    }
  }
}

