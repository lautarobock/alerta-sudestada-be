"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("./dao/dao");
const tide_job_1 = require("./job/tide.job");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, dao_1.init)();
            // const data = await new API().forecast();
            // console.log(JSON.stringify(Helper.forecast(data), undefined, 2));
            yield new tide_job_1.TideJob().run();
            // const data = await new API().current();
            // const astronomicals = Helper.astronomicals(data);
            // const readings = Helper.readings(data);
            // console.log(readings.pop()?.moment);
        }
        finally {
            yield (0, dao_1.close)();
        }
    });
}
run().catch(console.dir);
//# sourceMappingURL=test.js.map