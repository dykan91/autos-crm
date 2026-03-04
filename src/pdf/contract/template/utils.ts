import jsPDF from 'jspdf';

export const PAGE = { w: 210, h: 297 };
export const M = { l: 18, r: 18, t: 18, b: 18 };
export const L = M.l;
export const R = PAGE.w - M.r;

export function s(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v);
}

export function setFont(pdf: jsPDF, style: 'normal' | 'bold', size: number) {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
}

export function text(pdf: jsPDF, t: unknown, x: number, y: number, opts?: any) {
    pdf.text(s(t), x, y, opts);
}

export function wrap(pdf: jsPDF, t: string, maxWidth: number) {
    return pdf.splitTextToSize(t, maxWidth);
}

export function drawWrapped(pdf: jsPDF, t: string, x: number, y: number, maxWidth: number, lh: number) {
    const lines = wrap(pdf, t, maxWidth);
    for (const ln of lines) {
        text(pdf, ln, x, y);
        y += lh;
    }
    return y;
}

export function formatDateDE(iso?: string | null): string {
    if (!iso) return '';
    const x = iso.slice(0, 10);
    const [y, m, d] = x.split('-');
    if (!y || !m || !d) return x;
    return `${d}.${m}.${y}`;
}
