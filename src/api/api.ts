import Axios from 'axios';
import moment from 'moment';

export interface ReadingData {
    astronomica: ReadingValue[];
    lecturas: ReadingValue[];
}

export interface ReadingValue {
    fecha: string;
    altura: number;
}

export class API {

    private baseUrl = 'https://www.hidro.gov.ar';

    constructor() {}

    current() {
        return Axios.get<ReadingData>(`${this.baseUrl}/api/v1/AlturasHorarias/SFER/${this.now()}`).then(res => res.data);
    }

    forecast() {
        return Axios.get(`${this.baseUrl}/oceanografia/pronostico.asp`).then(res => res.data as string);
    }

    private now() {
        return this.format(new Date());
    }

    private format(date: Date) {
        return moment(date).format('YYYYMMDDHHmm');
    }
}