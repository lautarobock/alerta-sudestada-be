import { Db, MongoBulkWriteError, MongoClient, ServerApiVersion } from 'mongodb';
import {
    AppSettings,
    SETTINGS_ID,
    defaultSettingsDoc,
    isLegacyWindSettings,
    normalizeWindSettings,
    type WindSettings,
} from '../settings/defaults';

let client: MongoClient | undefined;

function mongoUri(): string {
    const uri = process.env.MONGO_URL ?? process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Set MONGO_URL or MONGODB_URI');
    }
    return uri;
}

function getClient(): MongoClient {
    if (!client) {
        client = new MongoClient(mongoUri(), {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
    }
    return client;
}

export function init() {
    console.log('Connecting to MongoDB');
    return getClient().connect();
}

export function close() {
    console.log('Closing MongoDB connection');
    if (!client) {
        return Promise.resolve();
    }
    return client.close();
}

export enum TideType {
    READING = 'reading',
    ASTRONOMICAL = 'astronomical'
}

export interface Tide {
    moment: Date;
    type: TideType;
    value: number;
}

export enum ForecastType {
    HIGH = 'high',
    LOW = 'low'
}

export interface Forecast {
    date: Date;
    mode: ForecastType;
    value: number;
}

export class TideDao {
    
    private db: Db;

    constructor() {
        this.db = getClient().db('alerta-sudestada');
    }

    lastReading() {
        return this.collection.findOne({ type: TideType.READING }, { sort: { moment: -1 } });
    }

    lastAstronomical() {
        return this.collection.findOne({ type: TideType.ASTRONOMICAL }, { sort: { moment: -1 } });
    }

    async insert(data: Tide[]) {
        return this.collection.insertMany(data);
    }

    private get collection() {
        return this.db.collection('tides');
    }
    
}

export class ForecastDao {
        
        private db: Db;
    
        constructor() {
            this.db = getClient().db('alerta-sudestada');
        }

        last() {
            return this.collection.findOne({}, { sort: { moment: -1 } });
        }
    
        async insert(values: Forecast[]) {
            return this.collection.insertOne({
                moment: new Date(),
                values
            });
        }

        private get collection() {
            return this.db.collection('forecast');
        }

}

export interface WindForecastDocument {
    dt: Date;
    speed: number;
    deg: number;
    gust?: number;
    insertedAt: Date;
    notifiedAt: Date | null;
}

export class SettingsDao {
    private db: Db;

    constructor() {
        this.db = getClient().db('alerta-sudestada');
    }

    async getOrSeed(): Promise<AppSettings & { wind: WindSettings }> {
        const existing = await this.collection.findOne({ _id: SETTINGS_ID });
        if (existing) {
            return this.normalizeAndPersistWind(existing);
        }
        const doc = defaultSettingsDoc();
        try {
            await this.collection.insertOne(doc);
            return { ...doc, wind: normalizeWindSettings(doc.wind) };
        } catch {
            const again = await this.collection.findOne({ _id: SETTINGS_ID });
            if (again) return this.normalizeAndPersistWind(again);
            throw new Error('Failed to seed settings');
        }
    }

    async getLastPushCheckAt(): Promise<Date | null> {
        const doc = await this.collection.findOne(
            { _id: SETTINGS_ID },
            { projection: { lastPushCheckAt: 1 } }
        );
        const value = doc?.lastPushCheckAt;
        if (!value) return null;
        const at = value instanceof Date ? value : new Date(value);
        return Number.isNaN(at.getTime()) ? null : at;
    }

    async markPushCheck(at: Date): Promise<void> {
        await this.getOrSeed();
        await this.collection.updateOne(
            { _id: SETTINGS_ID },
            { $set: { lastPushCheckAt: at } }
        );
    }

    private async normalizeAndPersistWind(
        doc: AppSettings
    ): Promise<AppSettings & { wind: WindSettings }> {
        const wind = normalizeWindSettings(doc.wind);
        if (isLegacyWindSettings(doc.wind)) {
            await this.collection.updateOne(
                { _id: SETTINGS_ID },
                { $set: { wind, updatedAt: new Date() } }
            );
        }
        return { ...doc, wind };
    }

    private get collection() {
        return this.db.collection<AppSettings>('settings');
    }
}

export class WindForecastDao {
    private db: Db;

    constructor() {
        this.db = getClient().db('alerta-sudestada');
    }

    async ensureIndexes() {
        await this.collection.createIndex({ dt: 1 }, { unique: true });
    }

    async findByDt(dts: Date[]): Promise<Map<number, WindForecastDocument>> {
        if (dts.length === 0) return new Map();
        const docs = await this.collection
            .find({ dt: { $in: dts } })
            .toArray();
        return new Map(docs.map((d) => [new Date(d.dt).getTime(), d]));
    }

    async insertMany(slots: Omit<WindForecastDocument, 'notifiedAt'>[]) {
        if (slots.length === 0) return 0;
        const docs: WindForecastDocument[] = slots.map((s) => ({
            ...s,
            notifiedAt: null,
        }));
        try {
            const result = await this.collection.insertMany(docs, { ordered: false });
            return result.insertedCount;
        } catch (e: unknown) {
            if (e instanceof MongoBulkWriteError && e.code === 11000) {
                return e.insertedCount ?? 0;
            }
            throw e;
        }
    }

    /** Refresh speed, direction and gust. Leaves notifiedAt untouched. */
    async updateForecastFields(
        slots: Pick<WindForecastDocument, 'dt' | 'speed' | 'deg' | 'gust'>[]
    ): Promise<number> {
        if (slots.length === 0) return 0;
        const result = await this.collection.bulkWrite(
            slots.map((s) => {
                const set: { speed: number; deg: number; gust?: number } = {
                    speed: s.speed,
                    deg: s.deg,
                };
                const unsetGust = typeof s.gust !== 'number';
                if (!unsetGust) set.gust = s.gust;
                return {
                    updateOne: {
                        filter: { dt: s.dt },
                        update: unsetGust
                            ? { $set: set, $unset: { gust: '' } }
                            : { $set: set },
                    },
                };
            }),
            { ordered: false }
        );
        return result.modifiedCount;
    }

    private get collection() {
        return this.db.collection<WindForecastDocument>('windForecast');
    }
}