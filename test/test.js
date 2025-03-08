import { findNextTimeByCond, formatET, getExtendEorzeaClock, localTimeToEorzea } from '../index.js';
import rfc6902 from 'rfc6902';

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
}, 84 * 60 * 60, 25, undefined, new Date('2024-11-12'));

const expect = [
    {
      "timeStr": "LT 2024/11/30 19:30:00 ET 星4月 4日(土属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2024/11/30 19:53:20(ET 08:00)变为 碧空",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2024/11/30 21:14:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2024/12/13 02:40:00 ET 星2月 1日(风属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2024/12/13 03:03:20(ET 08:00)变为 阴云",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2024/12/13 07:54:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2024/12/21 00:50:00 ET 灵4月 4日(土属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2024/12/21 01:13:20(ET 08:00)变为 碧空",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2024/12/21 02:34:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2024/12/27 06:10:00 ET 灵6月 4日(土属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2024/12/27 06:33:20(ET 08:00)变为 碧空",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2024/12/27 07:54:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/1/3 23:40:00 ET 星3月 3日(火属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/1/4 00:03:20(ET 08:00)变为 微风",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/1/4 02:34:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/1/8 13:20:00 ET 灵4月 1日(风属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/1/8 13:43:20(ET 08:00)变为 碧空",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/1/8 18:34:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/1/13 07:40:00 ET 星6月 3日(火属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/1/13 08:03:20(ET 08:00)变为 晴朗",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/1/13 10:34:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/1/17 22:30:00 ET 灵1月 2日(雷属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/1/17 22:53:20(ET 08:00)变为 晴朗",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/1/18 02:34:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/1/31 22:30:00 ET 星6月 2日(雷属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/1/31 22:53:20(ET 08:00)变为 微风",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/2/1 02:34:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/2/18 01:10:00 ET 灵5月 2日(雷属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/2/18 01:33:20(ET 08:00)变为 碧空",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/2/18 05:14:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/2/22 18:20:00 ET 星1月 3日(火属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/2/22 18:43:20(ET 08:00)变为 微风",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/2/22 21:14:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/3/7 06:10:00 ET 星5月 4日(土属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/3/7 06:33:20(ET 08:00)变为 碧空",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/3/7 07:54:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/3/13 08:00:00 ET 星1月 1日(风属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/3/13 08:23:20(ET 08:00)变为 阴云",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/3/13 13:14:59出现",
      "duration": "持续时间：1400秒"
    },
    {
      "timeStr": "LT 2025/3/30 10:40:00 ET 灵6月 1日(风属日) 00:00(风属时)",
      "weatherStr": "奥阔帕恰山 当前天气：薄雾，将在2025/3/30 11:03:20(ET 08:00)变为 晴朗",
      "moonStr": "当前月相：新月 下一个月相 娥眉月 将在2025/3/30 15:54:59出现",
      "duration": "持续时间：1400秒"
    }
  ];
const actual = result.map(it => ({...showTimeInfo(it.date, '奥阔帕恰山'), duration: `持续时间：${Math.round(it.duration / 1000)}秒`}));
const patch = rfc6902.createPatch(expect, actual);
if (patch.length > 0) {
  console.log('测试失败，不同点如下：');
  console.log(patch);
} else {
  console.log('测试成功');
}


