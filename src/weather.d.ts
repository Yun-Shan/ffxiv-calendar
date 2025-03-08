/**
 * 计算指定的本地时间的指定地点的天气
 *
 * @param localDate {Date}
 * @param locName {string}
 * @return {string} 天气名称
 */
export function forecastWeather(localDate: Date, locName: string): string;
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
export function findNextWeatherTime(localDate: Date, locName: string, weatherName?: string | undefined, count?: number | undefined, untilLocalDate?: Date | undefined): {
    date: Date;
    weather: string;
}[] | undefined;
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
export function findPrevWeatherTime(localDate: Date, locName: string, weatherName?: string | undefined, count?: number | undefined, untilLocalDate?: Date | undefined): {
    date: Date;
    weather: string;
}[] | undefined;
