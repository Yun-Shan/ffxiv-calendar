import { describe, expect, jest, test } from '@jest/globals';
import { findNextTimeByCond } from '../index.js';

describe('findNextTimeByCond', () => {

  test('S怪：厌忌之人 奇里格', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-11-12'));
    const result = findNextTimeByCond({
      etRange: [0, 800],
      moon: '新月',
      weather: '薄雾',
      loc: '奥阔帕恰山',
    }, 84 * 60 * 60, 15);
    expect(result).toStrictEqual([
      { date: new Date('2024-11-30T11:30:00.000Z'), duration: 1400000 },
      { date: new Date('2024-12-12T18:40:00.000Z'), duration: 1400000 },
      { date: new Date('2024-12-20T16:50:00.000Z'), duration: 1400000 },
      { date: new Date('2024-12-26T22:10:00.000Z'), duration: 1400000 },
      { date: new Date('2025-01-03T15:40:00.000Z'), duration: 1400000 },
      { date: new Date('2025-01-08T05:20:00.000Z'), duration: 1400000 },
      { date: new Date('2025-01-12T23:40:00.000Z'), duration: 1400000 },
      { date: new Date('2025-01-17T14:30:00.000Z'), duration: 1400000 },
      { date: new Date('2025-01-31T14:30:00.000Z'), duration: 1400000 },
      { date: new Date('2025-02-17T17:10:00.000Z'), duration: 1400000 },
      { date: new Date('2025-02-22T10:20:00.000Z'), duration: 1400000 },
      { date: new Date('2025-03-06T22:10:00.000Z'), duration: 1400000 },
      { date: new Date('2025-03-13T00:00:00.000Z'), duration: 1400000 },
      { date: new Date('2025-03-30T02:40:00.000Z'), duration: 1400000 },
      { date: new Date('2025-04-11T16:50:00.000Z'), duration: 1400000 }
    ]);
  });

  test('鱼：大钝甲鱼', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-03-11 03:00:00'));
    const result = findNextTimeByCond({
      etRange: [400, 900],
    }, 0, 10);
    expect(result).toStrictEqual([
      { date: new Date('2025-03-10T19:41:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-10T20:51:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-10T22:01:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-10T23:11:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-11T00:21:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-11T01:31:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-11T02:41:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-11T03:51:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-11T05:01:40.000Z'), duration: 875000 },
      { date: new Date('2025-03-11T06:11:40.000Z'), duration: 875000 }
    ]);
  });

  test('鱼：熔岩王', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-03-11 03:00:00'));
    const result = findNextTimeByCond({
      etRange: [900, 1700],
      weather: { whitelist: ['晴朗', '碧空'] },
      loc: '龙堡参天高地',
    }, 0, 10);
    expect(result).toStrictEqual([
      { date: new Date('2025-03-10T19:06:40.021Z'), duration: 175000 },
      { date: new Date('2025-03-10T19:56:15.021Z'), duration: 1400000 },
      { date: new Date('2025-03-10T22:36:40.021Z'), duration: 175000 },
      { date: new Date('2025-03-10T23:26:15.021Z'), duration: 1400000 },
      { date: new Date('2025-03-11T00:36:15.021Z'), duration: 1400000 },
      { date: new Date('2025-03-11T01:46:15.021Z'), duration: 1400000 },
      { date: new Date('2025-03-11T02:56:15.000Z'), duration: 1225000 },
      { date: new Date('2025-03-11T04:06:15.000Z'), duration: 1400000 },
      { date: new Date('2025-03-11T05:36:40.000Z'), duration: 175000 },
      { date: new Date('2025-03-11T06:26:15.000Z'), duration: 1400000 }
    ]);
  });

  test('鱼皇：红龙', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-03-11 20:00:00'));
    const result = findNextTimeByCond({
      etRange: [400, 800],
      loc: '红玉海',
      weather: { sequences: [['打雷', '阴云']] },
    }, 0, 10);
    expect(result).toStrictEqual([
      { date: new Date('2025-03-11T13:11:40.042Z'), duration: 700000 },
      { date: new Date('2025-03-15T04:41:40.042Z'), duration: 700000 },
      { date: new Date('2025-03-15T05:51:40.042Z'), duration: 700000 },
      { date: new Date('2025-03-26T17:11:40.042Z'), duration: 700000 },
      { date: new Date('2025-04-01T22:31:40.042Z'), duration: 700000 },
      { date: new Date('2025-04-05T04:41:40.042Z'), duration: 700000 },
      { date: new Date('2025-04-07T11:31:40.042Z'), duration: 700000 },
      { date: new Date('2025-04-08T16:41:40.042Z'), duration: 700000 },
      { date: new Date('2025-04-08T19:01:40.042Z'), duration: 700000 },
      { date: new Date('2025-04-10T21:11:40.042Z'), duration: 700000 }
    ]);
  });

});
