import { calcEorzeaClock, eorzeaTimeToLocal } from './time.js';

// 本文件代码参考自 https://garlandtools.cn/db/js/gt.js 略作修改

/**
 * @typedef {'新月'| '娥眉月'| '上弦月'| '盈凸月'| '满月'| '亏凸月'| '下弦月'| '残月'} MoonType
 */

/**
 * 根据指定ET计算当天是当月的第几天
 *
 * @param eDate {Date | number} ET
 * @return {number} 0-31
 */
function daysIntoLunarCycle(eDate) {
  // Moon is visible starting around 6pm.  Change phase around noon when
  // it can't be seen.
  const timestamp = typeof eDate === 'number' ? eDate : eDate.getTime();
  return ((timestamp / 86400_000) + .5) % 32;
}

/** @type {MoonType[]} */
const moons = ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];

/**
 * 根据指定ET获取当前月相
 *
 * @param eDate {Date | number} ET
 * @return {{moon: string, moonDays: number}} moon: 当前月相名称，moonDays: 当天是当前月相的第几天(每个月相有4天)
 */
export function calcMoonPhase(eDate) {
  const daysIntoCycle = daysIntoLunarCycle(eDate);
  // 4 days per moon.
  const index = Math.floor(daysIntoCycle / 4);
  return { moon: moons[index], moonDays: Math.floor(daysIntoCycle % 4) + 1 };
}

/**
 * 查找月相时间
 *
 * @param localDate {Date} 当前时间，用作起始点往前/后查找
 * @param moonName {MoonType | undefined} 指定需要查找的月相，不指定时接受所有月相
 * @param nextOrPrev {'next' | 'prev'} 往前还是往后查找
 * @param count {number=} 需要查找几个目标时间点
 *
 * @return {{ date: Date, moon: string }[]} count数量的月相起始时间点(本地时间)
 */
function findMoonTime(
  localDate, moonName,
  nextOrPrev, count = 1
) {
  if (moonName && !moons.some(it => it === moonName)) throw new Error(`Unknown moonName ${moonName}`);
  const clock = calcEorzeaClock(localDate);
  // 把时间规整到月相起始日的中午十二点
  let etOffset = clock.eorzeaTime;
  etOffset -= clock.millisecond;
  etOffset -= clock.second * 1000;
  etOffset -= clock.minute * 60 * 1000;
  etOffset -= (clock.hour - 12) * 60 * 60 * 1000;
  const daysOfCycle = Math.floor(daysIntoLunarCycle(etOffset) % 4);
  etOffset -= daysOfCycle * 24 * 60 * 60 * 1000;

  /** @type {{ date: Date, moon: string }[]} */
  const result = [];
  while (count-- > 0) {
    /** @type {string} */
    let curMoon;
    // 指定月相时从当前时间开始找(因为这时候是希望看到尽可能接近当前时间的目标月相)，不指定月相时直接偏移时间再确认月相(因为这时候是希望看到偏移后的月相)
    if (moonName) {
      do {
        curMoon = moons[Math.floor(daysIntoLunarCycle(etOffset) / 4)];
        if (curMoon === moonName) {
          result.push({date: eorzeaTimeToLocal(new Date(etOffset)), moon: curMoon});
          // 找到之后直接偏移32天，因为月相的循环周期是32天
          etOffset += 32 * 24 * 60 * 60 * 1000 * (nextOrPrev === 'next' ? 1 : -1);
          break;
        }
        // 由于月相只有8种，所以只偏移4天进行while true尝试是可接受的，当然直接通过月相索引计算偏移更好(这样就不需要循环了)
        etOffset += 4 * 24 * 60 * 60 * 1000 * (nextOrPrev === 'next' ? 1 : -1);
      } while (true);
    } else {
      etOffset += 4 * 24 * 60 * 60 * 1000 * (nextOrPrev === 'next' ? 1 : -1);
      curMoon = moons[Math.floor(daysIntoLunarCycle(etOffset) / 4)];
      result.push({date: eorzeaTimeToLocal(new Date(etOffset)), moon: curMoon});
    }
  }
  return result;
}

/**
 * 查找未来的月相时间
 *
 * @param localDate {Date} 当前时间，用作起始点往未来时间点查找
 * @param moonName {MoonType=} 指定需要查找的月相，不指定时接受所有月相
 * @param count {number=} 需要查找几个目标时间点
 *
 * @return {{ date: Date, moon: string }[]} count数量的月相起始时间点(本地时间)
 */
export function findNextMoonTime(localDate, moonName, count = 1) {
  return findMoonTime(localDate, moonName, 'next', count);
}

/**
 * 查找以前的月相时间
 *
 * @param localDate {Date} 当前时间，用作起始点往以前时间点查找
 * @param moonName {MoonType=} 指定需要查找的月相，不指定时接受所有月相
 * @param count {number=} 需要查找几个目标时间点
 *
 * @return {{ date: Date, moon: string }[]} count数量的月相起始时间点(本地时间)
 */
export function findPrevMoonTime(localDate, moonName, count = 1) {
  return findMoonTime(localDate, moonName, 'prev', count);
}
