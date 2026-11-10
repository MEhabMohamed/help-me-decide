type TimeUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

const multipliers: Record<TimeUnit, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
};

class ToMs {
    year = (value: number): number => value * multipliers.year;
    month = (value: number): number => value * multipliers.month;
    day = (value: number): number => value * multipliers.day;
    hour = (value: number): number => value * multipliers.hour;
    minute = (value: number): number => value * multipliers.minute;
    second = (value: number): number => value * multipliers.second;
}

class ToSec {
    constructor(private readonly time: ToMs) {}
    second = (value: number): number => this.time.second(value) / 1000;
    minute = (value: number): number => this.time.minute(value) / 1000;
    hour = (value: number): number => this.time.hour(value) / 1000;
    day = (value: number): number => this.time.day(value) / 1000;
    month = (value: number): number => this.time.month(value) / 1000;
    year = (value: number): number => this.time.year(value) / 1000;
}

export const toMs = new ToMs();
export const toSec = new ToSec(toMs);

