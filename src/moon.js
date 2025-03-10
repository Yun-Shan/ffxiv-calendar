import { calcEorzeaClock, eorzeaTimeToLocal } from './time.js';

// 本文件代码参考自 https://garlandtools.cn/db/js/gt.js 略作修改

/**
 * @typedef {'新月'| '娥眉月'| '上弦月'| '盈凸月'| '满月'| '亏凸月'| '下弦月'| '残月'} MoonType
 */

/** @type {MoonType[]} */
const moons = ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];

const PHASE_SHIFT_DAYS = 4;   // 单个月相阶段天数
const LUNAR_CYCLE_DAYS = PHASE_SHIFT_DAYS * moons.length;  // 完整月相周期天数

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
  return ((timestamp / 86400_000) + .5) % LUNAR_CYCLE_DAYS;
}

/**
 * 根据指定ET获取当前月相
 *
 * @param eDate {Date | number} ET
 * @return {{moon: string, moonDays: number}} moon: 当前月相名称，moonDays: 当天是当前月相的第几天(每个月相有4天)
 */
export function calcMoonPhase(eDate) {
  const daysIntoCycle = daysIntoLunarCycle(eDate);
  // 4 days per moon.
  const index = Math.floor(daysIntoCycle / PHASE_SHIFT_DAYS);
  return { moon: moons[index], moonDays: Math.floor(daysIntoCycle % PHASE_SHIFT_DAYS) + 1 };
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
  if (moonName && !moons.includes(moonName)) {
    throw new Error(`Unknown moonName ${moonName}`);
  }
  const clock = calcEorzeaClock(localDate);
  // 把时间规整到月相起始日的中午十二点
  let etOffset = clock.eorzeaTime;
  etOffset -= clock.millisecond;
  etOffset -= clock.second * 1000;
  etOffset -= clock.minute * 60_000;
  etOffset -= (clock.hour - 12) * 3600_000;
  // 减去当前月相已经过的天数来调整到起始日
  etOffset -= Math.floor(daysIntoLunarCycle(etOffset) % PHASE_SHIFT_DAYS) * 86400_000;

  // 闭包处理时间偏移计算
  const applyOffset = (time, days) => {
    return time + days * 86400_000 * (nextOrPrev === 'next' ? 1 : -1);
  };

  /** @type {{ date: Date, moon: string }[]} */
  const result = [];
  while (count-- > 0) {
    /** @type {string} */
    let curMoon;
    // 指定月相时从当前时间开始找(因为这时候是希望看到尽可能接近当前时间的目标月相)，不指定月相时直接偏移时间再确认月相(因为这时候是希望看到偏移后的月相)
    if (moonName) {
      let found = false;
      let cursor = etOffset;

      const moonNameIndex = moons.indexOf(moonName);
      // 最大循环次数等于月相种类数（8种）
      for (let attempt = 0; attempt < 8; attempt++) {
        const phaseIndex = Math.floor(daysIntoLunarCycle(cursor) / 4);
        if (phaseIndex === moonNameIndex) {
          result.push({
            date: eorzeaTimeToLocal(new Date(cursor)),
            moon: moonName
          });
          etOffset = applyOffset(cursor, 32); // 32天完整周期
          found = true;
          break;
        }
        cursor = applyOffset(cursor, 4);
      }

      if (!found) {
        throw new Error("Target moon phase not found in cycle");
      }
    } else {
      etOffset = applyOffset(etOffset, 4);
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
