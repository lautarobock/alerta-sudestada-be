// import moment from "moment";
import moment from 'moment-timezone';
import { ReadingData, ReadingValue } from "../api/api";
import { Forecast, ForecastType, Tide, TideType } from "../dao/dao";
import { JSDOM } from 'jsdom';

export class Helper {

    public static astronomicals(data: ReadingData): Tide[] {
        return this.convertField(data, 'astronomica', TideType.ASTRONOMICAL);
    }

    public static readings(data: ReadingData): Tide[] {
        return this.convertField(data, 'lecturas', TideType.READING);
    }

    public static forecast(data: string): Forecast[] {
        const tableData = this.parseHtmlTable(data);
        const names = tableData.map(row => row[0].trim());
        const idx = names.indexOf('SAN FERNANDO');
        const toIdx = names.lastIndexOf('', idx + 1);
        return tableData.slice(idx, toIdx + 1).map(row => ({
            date: moment.tz(`${row[4]} ${row[2]}`, 'DD/MM/YYYY HH:mm', 'America/Argentina/Buenos_Aires').toDate(),
            mode: row[1] === 'BAJAMAR' ? ForecastType.LOW : ForecastType.HIGH,
            value: parseFloat(row[3])
        }));
    }

    private static convertField(data: ReadingData, readFrom: string, type: TideType): Tide[] {
        return ((data  as any)[readFrom] as ReadingValue[]).filter(v => v.altura !== null).map(value => ({
            moment: new Date(value.fecha),
            type,
            value: value.altura
        }));
    }

    private static parseHtmlTable(html: string): string[][] {
        const tableData: string[][] = [];
    
        // Parse the HTML content
        const document = new JSDOM(html).window.document;
    
        // Find the table element
        const table = document.querySelector('table');
    
        if (table !== null) {
            // Get all rows in the table
            const rows = Array.from(table.querySelectorAll('tr'));
    
            // Iterate through each row
            rows.forEach((row: Element) => {
                const rowData: string[] = [];
    
                // Get all cells in the row
                const cells = Array.from(row.children);
    
                // Iterate through each cell
                cells.forEach((cell: Element) => {
                    // Get the text content of the cell and add it to the rowData list
                    rowData.push(cell.textContent!.trim());
                });
    
                // Add the rowData list to the tableData list
                tableData.push(rowData);
            });
        }
    
        return tableData;
    }
}