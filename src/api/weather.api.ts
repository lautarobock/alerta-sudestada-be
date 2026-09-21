import Axios from 'axios';

export interface OwmForecastWind {
    speed: number;
    deg: number;
    gust?: number;
}

export interface OwmForecastItem {
    dt: number;
    wind: OwmForecastWind;
}

export interface OwmForecastResponse {
    list: OwmForecastItem[];
}

const LAT = '-34.426';
const LON = '-58.5796';

export class WeatherAPI {
    private baseUrl = 'https://api.openweathermap.org/data/2.5';

    forecast(): Promise<OwmForecastResponse> {
        const key = process.env.OPENWEATHER_API_KEY;
        if (!key) {
            throw new Error('Set OPENWEATHER_API_KEY');
        }
        const url = `${this.baseUrl}/forecast`;
        return Axios.get<OwmForecastResponse>(url, {
            params: {
                lat: LAT,
                lon: LON,
                appid: key,
                units: 'metric',
                lang: 'es',
            },
        }).then((res) => res.data);
    }
}
