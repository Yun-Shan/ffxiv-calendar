import { findNextTimeByCond, formatET, getExtendEorzeaClock, localTimeToEorzea } from '../index.js';
import rfc6902 from 'rfc6902';
import { diffString } from 'json-diff';

function showTimeInfo(localDate, loc) {
  const clock = getExtendEorzeaClock(localDate);
  let weatherStr;
  const nextWeather = clock.nextWeather(loc);
  if (nextWeather) {
    const currentWeather = clock.getWeather(loc);
    weatherStr = `${loc} 当前天气：${currentWeather}，将在${nextWeather.date.toLocaleString()}(ET ${formatET(localTimeToEorzea(nextWeather.date))})变为 ${nextWeather.weather}`;
  } else {
    weatherStr = `${loc} 无天气变化`;
  }
  const nextMoon = clock.nextMoon();
  const moonStr = `当前月相：${clock.getMoonPhase()} 下一个月相 ${nextMoon.moon} 将在${nextMoon.date.toLocaleString()}出现`;
  const timeStr = `LT ${localDate.toLocaleString()} ET ${clock.formatDateTime()}`;
  return { timeStr, weatherStr, moonStr };
}

const result = findNextTimeByCond({
  etRange: [0, 800],
  moon: '新月',
  weather: '薄雾',
  loc: '奥阔帕恰山',
}, 84 * 60 * 60, 15, undefined, new Date('2024-11-12'));

let expect = [
  {
    timeStr: 'LT 2024/11/30 19:30:00 ET 星4月 4日(土属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2024/11/30 19:53:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 上弦月 将在2024/12/1 00:45:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2024/12/13 02:40:00 ET 星2月 1日(风属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2024/12/13 03:03:20(ET 08:00)变为 阴云',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2024/12/13 06:45:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2024/12/21 00:50:00 ET 灵4月 4日(土属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2024/12/21 01:13:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 上弦月 将在2024/12/21 06:05:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2024/12/27 06:10:00 ET 灵6月 4日(土属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2024/12/27 06:33:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 上弦月 将在2024/12/27 11:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/1/3 23:40:00 ET 星3月 3日(火属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/1/4 00:03:20(ET 08:00)变为 微风',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/1/4 01:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/1/8 13:20:00 ET 灵4月 1日(风属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/1/8 13:43:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/1/8 17:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/1/13 07:40:00 ET 星6月 3日(火属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/1/13 08:03:20(ET 08:00)变为 晴朗',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/1/13 09:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/1/17 22:30:00 ET 灵1月 2日(雷属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/1/17 22:53:20(ET 08:00)变为 晴朗',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/1/18 01:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/1/31 22:30:00 ET 星6月 2日(雷属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/1/31 22:53:20(ET 08:00)变为 微风',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/2/1 01:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/2/18 01:10:00 ET 灵5月 2日(雷属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/2/18 01:33:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/2/18 04:05:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/2/22 18:20:00 ET 星1月 3日(火属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/2/22 18:43:20(ET 08:00)变为 微风',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/2/22 20:05:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/3/7 06:10:00 ET 星5月 4日(土属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/3/7 06:33:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 上弦月 将在2025/3/7 11:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/3/13 08:00:00 ET 星1月 1日(风属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/3/13 08:23:20(ET 08:00)变为 阴云',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/3/13 12:05:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/3/30 10:40:00 ET 灵6月 1日(风属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/3/30 11:03:20(ET 08:00)变为 晴朗',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/3/30 14:45:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/4/12 00:50:00 ET 灵4月 4日(土属日) 00:00(风属时)',
    weatherStr: '奥阔帕恰山 当前天气：薄雾，将在2025/4/12 01:13:20(ET 08:00)变为 碧空',
    moonStr: '当前月相：新月 下一个月相 上弦月 将在2025/4/12 06:05:00出现',
    duration: '持续时间：1400秒'
  }
];
let actual = result.map(it => ({ ...showTimeInfo(it.date, '奥阔帕恰山'), duration: `持续时间：${Math.round(it.duration / 1000)}秒` }));
let patch = rfc6902.createPatch(expect, actual);
if (patch.length > 0) {
  console.log('测试1失败，不同点如下：');
  console.log(diffString(expect, actual));
  console.log('实际内容：');
  console.log(actual);
} else {
  console.log('测试1成功');
}

const result2 = findNextTimeByCond({
  etRange: [900, 1700],
  weather: { whitelist: ['晴朗', '碧空'] },
  loc: '龙堡参天高地',
}, 0, 10, undefined, new Date('2025-03-09 15:46:00'));

expect = [
  {
    timeStr: 'LT 2025/3/9 15:46:15 ET 灵5月 21日(冰属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：碧空，将在2025/3/9 16:06:40(ET 16:00)变为 晴朗',
    moonStr: '当前月相：亏凸月 下一个月相 下弦月 将在2025/3/9 19:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/3/9 16:56:15 ET 灵5月 22日(水属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：晴朗，将在2025/3/9 17:16:40(ET 16:00)变为 碧空',
    moonStr: '当前月相：亏凸月 下一个月相 下弦月 将在2025/3/9 19:25:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/3/9 18:06:15 ET 灵5月 23日(星属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：晴朗，将在2025/3/9 18:26:40(ET 16:00)变为 打雷',
    moonStr: '当前月相：亏凸月 下一个月相 下弦月 将在2025/3/9 19:25:00出现',
    duration: '持续时间：1225秒'
  },
  {
    timeStr: 'LT 2025/3/9 19:36:40 ET 灵5月 24日(灵属日) 16:00(冰属时)',
    weatherStr: '龙堡参天高地 当前天气：晴朗，将在2025/3/9 20:00:00(ET 00:00)变为 晴朗',
    moonStr: '当前月相：下弦月 下一个月相 残月 将在2025/3/10 00:05:00出现',
    duration: '持续时间：175秒'
  },
  {
    timeStr: 'LT 2025/3/9 22:46:15 ET 灵5月 27日(火属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：晴朗，将在2025/3/9 23:06:40(ET 16:00)变为 阴云',
    moonStr: '当前月相：下弦月 下一个月相 残月 将在2025/3/10 00:05:00出现',
    duration: '持续时间：1225秒'
  },
  {
    timeStr: 'LT 2025/3/10 01:06:15 ET 灵5月 29日(冰属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：碧空，将在2025/3/10 01:26:40(ET 16:00)变为 碧空',
    moonStr: '当前月相：残月 下一个月相 新月 将在2025/3/10 04:45:00出现',
    duration: '持续时间：1400秒'
  },
  {
    timeStr: 'LT 2025/3/10 02:16:15 ET 灵5月 30日(水属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：碧空，将在2025/3/10 02:36:40(ET 16:00)变为 阴云',
    moonStr: '当前月相：残月 下一个月相 新月 将在2025/3/10 04:45:00出现',
    duration: '持续时间：1225秒'
  },
  {
    timeStr: 'LT 2025/3/10 03:46:40 ET 灵5月 31日(星属日) 16:00(冰属时)',
    weatherStr: '龙堡参天高地 当前天气：碧空，将在2025/3/10 04:10:00(ET 00:00)变为 晴朗',
    moonStr: '当前月相：残月 下一个月相 新月 将在2025/3/10 04:45:00出现',
    duration: '持续时间：175秒'
  },
  {
    timeStr: 'LT 2025/3/10 04:36:15 ET 灵5月 32日(灵属日) 09:00(土属时)',
    weatherStr: '龙堡参天高地 当前天气：晴朗，将在2025/3/10 04:56:40(ET 16:00)变为 阴云',
    moonStr: '当前月相：残月 下一个月相 娥眉月 将在2025/3/10 09:25:00出现',
    duration: '持续时间：1225秒'
  },
  {
    timeStr: 'LT 2025/3/10 06:06:40 ET 星6月 1日(风属日) 16:00(冰属时)',
    weatherStr: '龙堡参天高地 当前天气：晴朗，将在2025/3/10 06:30:00(ET 00:00)变为 扬沙',
    moonStr: '当前月相：新月 下一个月相 娥眉月 将在2025/3/10 09:25:00出现',
    duration: '持续时间：175秒'
  }
];
actual = result2.map(it => ({ ...showTimeInfo(it.date, '龙堡参天高地'), duration: `持续时间：${Math.round(it.duration / 1000)}秒` }));
patch = rfc6902.createPatch(expect, actual);
if (patch.length > 0) {
  console.log('测试2失败，不同点如下：');
  console.log(diffString(expect, actual));
  console.log('实际内容：');
  console.log(actual);
} else {
  console.log('测试2成功');
}
