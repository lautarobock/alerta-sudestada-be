import { Db, MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://lautaromail:OFZJa4VF3zxFkp4Q@alerta-sudestada.u76ftfr.mongodb.net/?retryWrites=true&w=majority&appName=alerta-sudestada";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


export function init() {
    console.log('MONGO_URL', uri);
    return client.connect();
}

export function close() {
    console.log('Closing MONGODB');
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
        this.db = client.db('alerta-sudestada');
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
            this.db = client.db('alerta-sudestada');
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