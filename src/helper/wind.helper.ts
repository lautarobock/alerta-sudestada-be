import type { OwmForecastItem } from '../api/weather.api';

export interface WindForecastSlot {
    dt: Date;
    speed: number;
    deg: number;
    gust?: number;
}

export function parseFutureForecastSlots(
    list: OwmForecastItem[]
): WindForecastSlot[] {
    const now = Date.now();
    const slots: WindForecastSlot[] = [];

    for (const item of list) {
        const dt = new Date(item.dt * 1000);
        if (dt.getTime() <= now) continue;

        const { speed, deg, gust } = item.wind;
        if (typeof deg !== 'number' || typeof speed !== 'number') continue;

        slots.push({
            dt,
            speed,
            deg,
            gust: typeof gust === 'number' ? gust : undefined,
        });
    }

    return slots;
}
