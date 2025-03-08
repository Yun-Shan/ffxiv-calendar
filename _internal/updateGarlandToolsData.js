/**
 * 该文件只需要每次版本更新的时候跑一次就行
 */
import rfc6902 from 'rfc6902';

/**
 * 只写了目前用到的，还有一堆没用到的字段没写
 * @typedef {{
 *   locationIndex: {
 *     [key: string]: {
 *       id: number;
 *       name: string;
 *       parentId?: number;
 *       size?: number;
 *       weatherRate?: number;
 *     }
 *   };
 *   skywatcher: {
 *     weatherIndex: string[];
 *     weatherRateIndex: {
 *       [key: string]: {
 *         id: number;
 *         rates: {
 *           weather: number;
 *           rate: number;
 *         }[];
 *       }
 *     };
 *   };
 * }} CoreData
 */

import * as fs from 'node:fs';

/**
 * @return {Promise<CoreData>}
 */
async function getGarlandToolsCoreData() {
  return fetch('https://garlandtools.cn/db/doc/core/chs/3/data.json').then(res => res.json());
}

const coreData = await getGarlandToolsCoreData();
const coreDataLocByName = Object.fromEntries(
  Object.values(coreData.locationIndex)
    .map(it => {
      const loc = {
        ...it,
        weatherRate: it.weatherRate ?
          coreData.skywatcher.weatherRateIndex[it.weatherRate]?.rates?.map(it => ({
            weather: coreData.skywatcher.weatherIndex[it.weather] ?? 'Unknown',
            rate: it.rate
          }))
          : undefined,
      };
      return [it.name, loc];
    })
);
// GarlandTools没有无名岛的数据，手动加上
coreDataLocByName['无名岛'] = {
  id: 4043,
  name: '无名岛',
  weatherRate: [
    {weather: '碧空', rate: 25},
    {weather: '晴朗', rate: 70},
    {weather: '阴云', rate: 80},
    {weather: '小雨', rate: 90},
    {weather: '薄雾', rate: 95},
    {weather: '暴雨', rate: 100},
  ]
}

if (fs.existsSync('../data/locDataByName.json')) {
  const patch = rfc6902.createPatch(JSON.parse(fs.readFileSync('../data/locDataByName.json', 'utf8')), coreDataLocByName);
  if (patch.length > 0) {
    console.log('数据变化：' + JSON.stringify(patch, null, 2));
  } else {
    console.log('数据无变化');
  }
}
fs.writeFileSync('../data/locDataByName.json', JSON.stringify(coreDataLocByName), 'utf8');
