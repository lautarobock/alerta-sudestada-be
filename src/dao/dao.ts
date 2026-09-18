import { Db, MongoClient, ServerApiVersion } from 'mongodb';

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