import jsPDF from 'jspdf';
import type { ContractPdfData } from '../types';
import { L, R, setFont, text } from './utils';
const INVOICE_START_NUMBER = 1;
export function generateInvoiceNumber(
    sequentialNumber: number,
    startFrom: number = 1
): string {
    const year = new Date().getFullYear();

    const padded = String(sequentialNumber + startFrom - 1).padStart(3, '0');

    return `${year}${padded}`;
}

export function renderClientInvoiceCar(pdf: jsPDF, data: ContractPdfData, startY: number) {
    let y = startY;

    setFont(pdf, 'normal', 12);

    const client = data.client;

    const clientLines = [
        client?.name,
        client?.address,
        client?.postalCity,
    ].filter((v): v is string => !!v && v.trim().length > 0)
        .map(v => v.toUpperCase());

    for (const line of clientLines) {
        text(pdf, line, L, y);
        y += 5;
    }

    y += 10;

    setFont(pdf, 'bold', 12);
    const invoiceNr = generateInvoiceNumber(Number(data.invoiceNr), INVOICE_START_NUMBER);
    text(pdf, `Rechnung ${invoiceNr}`, L, y);
    setFont(pdf, 'normal', 12);
    text(pdf, data.cityDateRight, R, y, { align: 'right' });
    y += 10;

    // car block (2 columns like in sample)
    setFont(pdf, 'bold', 10);
    text(pdf, '1 PKW', L, y);
    y += 8;

    setFont(pdf, 'normal', 10);
    // left labels
    text(pdf, 'Fahrzeug Ident. Nr.:', L, y);
    text(pdf, 'KFZ – Brief Nr.:', L, y + 6);
    text(pdf, 'EZ:', L, y + 12);
    text(pdf, 'Farbe:', L, y + 18);

    // right values
    const vx = L + 60;
    text(pdf, data.car.vin, vx, y);
    text(pdf, data.car.kfzBriefNr, vx, y + 6);
    text(pdf, data.car.ez, vx, y + 12);
    text(pdf, data.car.color, vx, y + 18);

    // car title on right top
    setFont(pdf, 'bold', 10);
    text(pdf, data.car.title, vx, y - 8);

    y += 26;
    return y;
}
