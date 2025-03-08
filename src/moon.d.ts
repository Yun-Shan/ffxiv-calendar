export type MoonType = '新月'| '娥眉月'| '上弦月'| '盈凸月'| '满月'| '亏凸月'| '下弦月'| '残月';

/**
 * 根据指定ET获取当前月相
 *
 * @param eDate {Date | number} ET
 * @return {{moon: string, moonDays: number}} moon: 当前月相名称，moonDays: 当天是当前月相的第几天(每个月相有4天)
 */
export function calcMoonPhase(eDate: Date | number): {
    moon: string;
    moonDays: number;
};
/**
 * 查找未来的月相时间
 *
 * @param localDate {Date} 当前时间，用作起始点往未来时间点查找
 * @param moonName {MoonType=} 指定需要查找的月相，不指定时接受所有月相
 * @param count {number=} 需要查找几个目标时间点
 *
 * @return {{ date: Date, moon: string }[]} count数量的月相起始时间点(本地时间)
 */
export function findNextMoonTime(localDate: Date, moonName?: MoonType | undefined, count?: number | undefined): {
    date: Date;
    moon: string;
}[];
/**
 * 查找以前的月相时间
 *
 * @param localDate {Date} 当前时间，用作起始点往以前时间点查找
 * @param moonName {MoonType=} 指定需要查找的月相，不指定时接受所有月相
 * @param count {number=} 需要查找几个目标时间点
 *
 * @return {{ date: Date, moon: string }[]} count数量的月相起始时间点(本地时间)
 */
export function findPrevMoonTime(localDate: Date, moonName?: MoonType | undefined, count?: number | undefined): {
    date: Date;
    moon: string;
}[];
