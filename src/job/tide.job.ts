import axios from "axios";
import { API } from "../api/api";
import { WeatherAPI } from "../api/weather.api";
import {
    ForecastDao,
    SettingsDao,
    Tide,
    TideDao,
    WindForecastDao,
} from "../dao/dao";
import { Helper } from "../helper/helper";
import { parseFutureForecastSlots } from "../helper/wind.helper";

export class TideJob {

    private tideDao: TideDao;
    private forecastDao: ForecastDao;
    private windForecastDao: WindForecastDao;
    private settingsDao: SettingsDao;
    private api: API;
    private weatherApi: WeatherAPI;

    constructor() {
        this.tideDao = new TideDao();
        this.forecastDao = new ForecastDao();
        this.windForecastDao = new WindForecastDao();
        this.settingsDao = new SettingsDao();
        this.api = new API();
        this.weatherApi = new WeatherAPI();
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
        try {
            await this.runWindForecast();
        } catch (e) {
            console.error(e);
        }
        await this.notifyPushCheck();
    }

    private async notifyPushCheck() {
        const url = process.env.ALERTA_PUSH_CHECK_URL;
        const secret = process.env.PUSH_WEBHOOK_SECRET;
        if (!url || !secret) {
            console.warn(
                "Push check skipped: set ALERTA_PUSH_CHECK_URL and PUSH_WEBHOOK_SECRET"
            );
            return;
        }
        try {
            const res = await axios.post(
                url,
                {},
                {
                    headers: { Authorization: `Bearer ${secret}` },
                    timeout: 60_000,
                }
            );
            console.log("Push check OK:", res.data);
        } catch (e) {
            console.error("Push check failed:", e);
        }
    }

    private async runForecast() {
        const forecast = Helper.forecast(await this.api.forecast());
        const last = await this.forecastDao.last();
        if (!last || JSON.stringify(last.values) !== JSON.stringify(forecast)) {
            console.log('Inserting forecast');
            await this.forecastDao.insert(forecast);
        }
    }

    private async runWindForecast() {
        await this.settingsDao.getOrSeed();
        await this.windForecastDao.ensureIndexes();

        const data = await this.weatherApi.forecast();
        const future = parseFutureForecastSlots(data.list);
        if (future.length === 0) {
            console.log('No future wind forecast slots from OpenWeather');
            return;
        }

        const existing = await this.windForecastDao.findExistingDtTimes(
            future.map((s) => s.dt)
        );
        const toInsert = future.filter((s) => !existing.has(s.dt.getTime()));
        if (toInsert.length === 0) {
            console.log('All wind forecast slots already stored');
            return;
        }

        const now = new Date();
        const inserted = await this.windForecastDao.insertMany(
            toInsert.map((s) => ({
                dt: s.dt,
                speed: s.speed,
                deg: s.deg,
                gust: s.gust,
                insertedAt: now,
            }))
        );
        console.log(`Inserted ${inserted} wind forecast slot(s)`);
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