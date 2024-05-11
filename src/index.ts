import { API } from './api/api';
import { close, init } from './dao/dao';
import { Helper } from './helper/helper';
import { TideJob } from './job/tide.job';

async function run() {
    try {
        await init();

        // const data = await new API().forecast();
        // console.log(JSON.stringify(Helper.forecast(data), undefined, 2));
        await new TideJob().run();
        // const data = await new API().current();

        // const astronomicals = Helper.astronomicals(data);
        // const readings = Helper.readings(data);
        // console.log(readings.pop()?.moment);

    } finally {
        await close();
    }
}
run().catch(console.dir);