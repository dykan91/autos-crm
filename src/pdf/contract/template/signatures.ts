import jsPDF from 'jspdf';
import { L, R, setFont, text } from './utils';

export function renderSignatures(pdf: jsPDF, startY: number): number {
    let y = startY;

    const mid = L + (R - L) / 2;

    // Линии подписей
    pdf.setLineWidth(0.3);
    pdf.line(L, y, L + 70, y);
    pdf.line(mid + 5, y, mid + 75, y);

    y += 4;
    setFont(pdf, 'normal', 8);
    text(pdf, 'Datum / Unterschrift Verkäufer', L, y);
    text(pdf, 'Datum / Unterschrift Käufer', mid + 5, y);

    y += 8;
    return y;
}