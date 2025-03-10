/**
 * 天气条件
 *
 * 只有一种条件可以生效，优先级为 白名单->黑名单->序列，string类型视为单一白名单
 */
type WeatherCond = string | { whitelist?: string[], blacklist?: string[], sequences?: string[][] };

/**
 * 获取所有可用的地点名称列表
 *
 * @return {string[]}
 */
export function getAllowLocations(): string[];

/**
 * 计算指定的本地时间的指定地点的天气
 *
 * @param localDate {Date}
 * @param locName {string}
 * @return {string} 天气名称
 */
export function forecastWeather(localDate: Date, locName: string): string;

/**
 * 获得上一次天气变化的ET时间
 *
 * @param eDate {(Date | number)=} 指定ET时间，不指定则使用当前时间
 * @return {Date} 上一次天气变化的ET时间
 */
export function getWeatherInterval(eDate?: Date | number): Date;

/**
 * 查找未来的天气时间
 *
 * @param localDate {Date} 当前时间，用作起始点往未来查找
 * @param locName {string} 指定需要查找的地点
 * @param weatherCond {WeatherCond=} 指定需要查找的天气条件，不指定时接受所有天气
 * @param count {number=} 需要查找几个目标时间点
 * @param untilLocalDate {Date=} 限制查找的最远时间点，避免无限循环(不过天气查找本身应该不会有过多的循环)
 *
 * @return {{ date: Date, weather: string }[]}  count数量的天气起始时间点(本地时间)，如果直到untilLocalDate还找不够的话结果数量会小于count
 */
export function findNextWeatherTime(localDate: Date, locName: string, weatherCond?: WeatherCond | undefined, count?: number | undefined, untilLocalDate?: Date | undefined): {
    date: Date;
    weather: string;
}[];

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
export function findPrevWeatherTime(localDate: Date, locName: string, weatherCond?: WeatherCond | undefined, count?: number | undefined, untilLocalDate?: Date | undefined): {
    date: Date;
    weather: string;
}[];
