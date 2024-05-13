import { API } from './api/api';
import { ForecastDao, close, init } from './dao/dao';
import { Helper } from './helper/helper';
import { TideJob } from './job/tide.job';

async function run() {
    try {
        await init();

        const forecast = Helper.forecast(await new API().forecast());
        const last = await new ForecastDao().last();
        if (!last || JSON.stringify(last.values) !== JSON.stringify(forecast)) {
            console.log('Inserting forecast');
        }

    } finally {
        await close();
    }
}
run().catch(console.dir);