import jsPDF from 'jspdf';
import { PAGE, L, R, setFont, text } from './utils';
import { SELLER } from './config';

export function renderFooter(pdf: jsPDF) {
    const fy = PAGE.h - 12;

    pdf.setLineWidth(0.4);
    pdf.line(L, fy - 16, R, fy - 16);

    const titleGap = 6;
    const lineGap = 4;

    let colY = fy - 12;
    setFont(pdf, 'bold', 9);
    text(pdf, 'Anschrift:', L, colY);

    colY += titleGap;

    setFont(pdf, 'normal', 9);
    text(pdf, SELLER.name, L, colY);
    colY += lineGap;
    text(pdf, SELLER.address, L, colY);
    colY += lineGap;
    text(pdf, SELLER.city, L, colY);

    colY = fy - 12;
    setFont(pdf, 'bold', 9);
    text(pdf, 'Bankverbindung:', L + 65, colY);

    colY += titleGap;

    setFont(pdf, 'normal', 9);
    text(pdf, `IBAN: ${SELLER.bank.iban}`, L + 65, colY);
    colY += lineGap;
    text(pdf, `BIC: ${SELLER.bank.bic}`, L + 65, colY);
    colY += lineGap;
    text(pdf, SELLER.bank.bankName, L + 65, colY);

    colY = fy - 12;

    setFont(pdf, 'normal', 9);
    colY += titleGap;

    text(pdf, `St.-Nr.: ${SELLER.taxNumber}`, L + 130, colY);
    colY += lineGap;
    text(pdf, `USt-IdNr.: ${SELLER.vatId}`, L + 130, colY);
    colY += lineGap;
    text(pdf, `Tel: ${SELLER.phone}`, L + 130, colY);
}
