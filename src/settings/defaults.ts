export interface RiverThresholds {
    warning: number;
    alert: number;
    critical: number;
}

export interface WindSettings {
    degMin: number;
    degMax: number;
    minKmh: number;
}

export interface AppSettings {
    _id: 'global';
    river: RiverThresholds;
    wind: WindSettings;
    updatedAt: Date;
}

export const SETTINGS_ID = 'global' as const;

export const DEFAULT_RIVER: RiverThresholds = {
    warning: 2.5,
    alert: 3.0,
    critical: 3.5,
};

export const DEFAULT_WIND: WindSettings = {
    degMin: 90,
    degMax: 180,
    minKmh: 40,
};

export function defaultSettingsDoc(): AppSettings {
    return {
        _id: SETTINGS_ID,
        river: { ...DEFAULT_RIVER },
        wind: { ...DEFAULT_WIND },
        updatedAt: new Date(),
    };
}
