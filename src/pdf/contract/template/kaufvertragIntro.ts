import jsPDF from 'jspdf';
import type { ContractPdfData } from '../types';
import { L, R, setFont, text, drawWrapped } from './utils';
import { SELLER } from './config';
import { generateInvoiceNumber } from './clientInvoiceCar';
import type { ContractRowView } from '../../../pages/ContractsPage';

export function renderKaufvertragIntro(
    pdf: jsPDF,
    data: ContractPdfData,
    row: ContractRowView,
    startY: number
): number {
    let y = startY;

    // Заголовок
    setFont(pdf, 'bold', 14);
    const invoiceNr = generateInvoiceNumber(Number(data.invoiceNr), 1);
    text(pdf, `Kaufvertrag Nr. ${invoiceNr}`, L, y);
    setFont(pdf, 'normal', 10);
    text(pdf, data.cityDateRight, R, y, { align: 'right' });
    y += 10;

    // Разделитель
    pdf.setLineWidth(0.3);
    pdf.line(L, y, R, y);
    y += 8;

    // Две колонки: Verkäufer | Käufer
    const colMid = L + (R - L) / 2 + 5;

    setFont(pdf, 'bold', 10);
    text(pdf, 'Verkäufer:', L, y);
    text(pdf, 'Käufer:', colMid, y);
    y += 5;

    setFont(pdf, 'normal', 10);

    const sellerLines = [SELLER.name, SELLER.address, SELLER.city, `Tel: ${SELLER.phone}`];
    const buyerLines = [
        data.client.name,
        data.client.address,
        data.client.postalCity,
    ].filter(v => !!v && v.trim());

    const maxLines = Math.max(sellerLines.length, buyerLines.length);
    for (let i = 0; i < maxLines; i++) {
        if (sellerLines[i]) text(pdf, sellerLines[i], L, y);
        if (buyerLines[i]) text(pdf, buyerLines[i], colMid, y);
        y += 5;
    }

    y += 6;

    // Объект договора
    setFont(pdf, 'bold', 10);
    text(pdf, 'Kaufgegenstand:', L, y);
    y += 5;

    setFont(pdf, 'normal', 10);

    const labelX = L;
    const valueX = L + 52;
    const lh = 5.5;

    const carFields: [string, string][] = [
        ['Fahrzeug:', data.car.title],
        ['Fahrzeug Ident. Nr.:', data.car.vin],
        ['KFZ-Brief Nr.:', data.car.kfzBriefNr],
        ['EZ:', data.car.ez],
        ['Farbe:', data.car.color],
    ];

    for (const [label, value] of carFields) {
        if (!value?.trim()) continue;
        setFont(pdf, 'normal', 10);
        text(pdf, label, labelX, y);
        text(pdf, value, valueX, y);
        y += lh;
    }

    // Цена
    y += 2;
    const gross = row.price ?? null;
    if (gross !== null) {
        const formatted = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(gross);
        setFont(pdf, 'bold', 10);
        text(pdf, 'Kaufpreis:', labelX, y);
        setFont(pdf, 'normal', 10);
        text(pdf, formatted, valueX, y);
        y += lh;
    }

    y += 4;
    pdf.setLineWidth(0.2);
    pdf.line(L, y, R, y);
    y += 6;

    // Текст о соглашении
    setFont(pdf, 'normal', 9);
    y = drawWrapped(
        pdf,
        'Zwischen Verkäufer und Käufer wird folgender Kaufvertrag über das oben genannte Kraftfahrzeug geschlossen.',
        L, y, R - L, 4.5
    );
    y += 5;

    return y;
}