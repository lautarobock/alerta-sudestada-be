export interface RiverThresholds {
    warning: number;
    alert: number;
    critical: number;
}

export interface WindSpeedKmhThresholds {
    warning: number;
    alert: number;
    critical: number;
}

export interface WindSettings {
    speedKmh: WindSpeedKmhThresholds;
    directions: boolean[];
}

export interface LegacyWindSettings {
    degMin: number;
    degMax: number;
    minKmh: number;
}

export interface AppSettings {
    _id: 'global';
    river: RiverThresholds;
    wind: WindSettings | LegacyWindSettings;
    updatedAt: Date;
}

export const SETTINGS_ID = 'global' as const;

export const WIND_DIRECTION_COUNT = 16;

export const DEFAULT_RIVER: RiverThresholds = {
    warning: 2.5,
    alert: 3.0,
    critical: 3.5,
};

export const DEFAULT_WIND_SPEED: WindSpeedKmhThresholds = {
    warning: 30,
    alert: 40,
    critical: 55,
};

function directionsFromDegRange(degMin: number, degMax: number): boolean[] {
    const dirs = Array(WIND_DIRECTION_COUNT).fill(false) as boolean[];
    for (let i = 0; i < WIND_DIRECTION_COUNT; i++) {
        const center = i * 22.5;
        if (center >= degMin && center <= degMax) {
            dirs[i] = true;
        }
    }
    return dirs;
}

export function defaultWindDirectionsEastToSouth(): boolean[] {
    return directionsFromDegRange(90, 180);
}

export function defaultWindSettings(): WindSettings {
    return {
        speedKmh: { ...DEFAULT_WIND_SPEED },
        directions: defaultWindDirectionsEastToSouth(),
    };
}

export function isLegacyWindSettings(wind: unknown): wind is LegacyWindSettings {
    if (!wind || typeof wind !== 'object') return false;
    const w = wind as Record<string, unknown>;
    return (
        typeof w.degMin === 'number' &&
        typeof w.degMax === 'number' &&
        typeof w.minKmh === 'number' &&
        !('speedKmh' in w)
    );
}

export function migrateLegacyWindSettings(legacy: LegacyWindSettings): WindSettings {
    const alert = legacy.minKmh;
    return {
        speedKmh: {
            warning: Math.max(0, alert - 10),
            alert,
            critical: alert + 15,
        },
        directions: directionsFromDegRange(legacy.degMin, legacy.degMax),
    };
}

export function normalizeWindSettings(wind: unknown): WindSettings {
    if (isLegacyWindSettings(wind)) {
        return migrateLegacyWindSettings(wind);
    }
    if (wind && typeof wind === 'object' && 'speedKmh' in wind) {
        const w = wind as WindSettings;
        const directions =
            w.directions?.length === WIND_DIRECTION_COUNT
                ? [...w.directions]
                : defaultWindDirectionsEastToSouth();
        return {
            speedKmh: {
                warning: w.speedKmh?.warning ?? DEFAULT_WIND_SPEED.warning,
                alert: w.speedKmh?.alert ?? DEFAULT_WIND_SPEED.alert,
                critical: w.speedKmh?.critical ?? DEFAULT_WIND_SPEED.critical,
            },
            directions,
        };
    }
    return defaultWindSettings();
}

export function defaultSettingsDoc(): AppSettings {
    return {
        _id: SETTINGS_ID,
        river: { ...DEFAULT_RIVER },
        wind: defaultWindSettings(),
        updatedAt: new Date(),
    };
}

export function validateWindSettings(wind: WindSettings): boolean {
    const { speedKmh, directions } = wind;
    if (
        typeof speedKmh.warning !== 'number' ||
        typeof speedKmh.alert !== 'number' ||
        typeof speedKmh.critical !== 'number' ||
        speedKmh.warning >= speedKmh.alert ||
        speedKmh.alert >= speedKmh.critical
    ) {
        return false;
    }
    if (directions.length !== WIND_DIRECTION_COUNT) return false;
    return directions.some(Boolean);
}
