import { API } from "../api/api";
import { ForecastDao, Tide, TideDao } from "../dao/dao";
import { Helper } from "../helper/helper";

export class TideJob {

    private tideDao: TideDao;
    private forecastDao: ForecastDao;
    private api: API;

    constructor() {
        this.tideDao = new TideDao();
        this.forecastDao = new ForecastDao();
        this.api = new API();
    }

    async run() {
        try {
            await this.runTides();
        } catch (e) {
            console.error(e);
        }
        try {
            await this.runForecast();
        } catch (e) {
            console.error(e);
        }
        
    }

    private async runForecast() {
        const forecast = Helper.forecast(await this.api.forecast());
        const last = await this.forecastDao.last();
        if (!last || JSON.stringify(last.values) !== JSON.stringify(forecast)) {
            await this.forecastDao.insert(forecast);
        }
    }

    private async runTides() {
        const data = await this.api.current();

        const astronomicals = Helper.astronomicals(data);
        const readings = Helper.readings(data);

        const lastReading = await this.tideDao.lastReading();
        const lastAstronomical = await this.tideDao.lastAstronomical();

        const readingsToInsert = this.filter(readings, lastReading?.moment);
        if (readingsToInsert.length > 0) {
            console.log(`Inserting ${readingsToInsert.length} readings`);
            await this.tideDao.insert(readingsToInsert);
        } else {
            console.log('No new readings to insert');
        }

        const astronomicalsToInsert = this.filter(astronomicals, lastAstronomical?.moment);
        if (astronomicalsToInsert.length > 0) {
            console.log(`Inserting ${astronomicalsToInsert.length} astronomicals`);
            await this.tideDao.insert(astronomicalsToInsert);
        } else {
            console.log('No new astronomicals to insert');
        }
    }

    private filter(data: Tide[], last: Date | undefined) {
        if (last) {
            return data.filter(d => d.moment > last);
        } else {
            return data;
        }
    }
}