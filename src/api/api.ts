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
    constructor() {}

    current() {
        return Axios.get<ReadingData>(`http://www.hidro.gov.ar/api/v1/AlturasHorarias/SFER/${this.now()}`).then(res => res.data);
    }

    forecast() {
        return Axios.get('http://www.hidro.gov.ar/oceanografia/pronostico.asp').then(res => res.data as string);
    }

    private now() {
        return this.format(new Date());
    }

    private format(date: Date) {
        return moment(date).format('YYYYMMDDHHmm');
    }
}