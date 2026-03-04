import jsPDF from 'jspdf';
import type { ContractRowView } from '../../../pages/ContractsPage';
import { L, R, setFont, text } from './utils';

function formatMoney(v: number | null | undefined) {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function renderPriceBlock(pdf: jsPDF, row: ContractRowView, startY: number) {
    let y = startY;

    const gross = row.price ?? null;

    const xLabel = L;
    const xValueRight = xLabel + 80;

    const rightValue = (value: string, yy: number) => {
        pdf.text(value, xValueRight, yy, { align: 'right' });
    };

    // --- CASE 1: без налогов ---
    if (!row.tax_included || gross === null) {
        setFont(pdf, 'bold', 11);
        text(pdf, 'Gesamtpreis:', xLabel, y);
        setFont(pdf, 'normal', 11);
        rightValue(formatMoney(gross), y);
        y += 8;

        pdf.setLineWidth(0.2);
        pdf.line(L, y, R, y);
        y += 6;

        return y;
    }

    // --- CASE 2: с налогами 19% ---
    const VAT_RATE = 0.19;

    const net = round2(gross / (1 + VAT_RATE));
    const vat = round2(gross - net);

    setFont(pdf, 'normal', 11);

    text(pdf, 'Gesamtbetrag netto:', xLabel, y);
    rightValue(formatMoney(net), y);
    y += 6;

    text(pdf, 'USt. 19%:', xLabel, y);
    rightValue(formatMoney(vat), y);
    y += 6;

    setFont(pdf, 'bold', 11);
    text(pdf, 'Gesamtbetrag brutto:', xLabel, y);
    rightValue(formatMoney(gross), y);
    y += 8;

    pdf.setLineWidth(0.2);
    pdf.line(L, y, R, y);
    y += 6;

    return y;
}