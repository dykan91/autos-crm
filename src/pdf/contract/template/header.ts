import jsPDF from 'jspdf';
import { L, setFont, text } from './utils';
import { SELLER } from './config';
import logo from '../../../assets/logo.png';

export function renderHeader(pdf: jsPDF) {
    const y = 10;


    const logoWidth = 60;
    const logoHeight = 9;

    pdf.addImage(logo, 'PNG', L, y, logoWidth, logoHeight);

    const x = L + 82;
    setFont(pdf, 'bold', 12);
    text(pdf, SELLER.name, x, y + 3);

    setFont(pdf, 'normal', 10);
    text(pdf, `${SELLER.address}, ${SELLER.city}`, x, y + 9);

    return y + 26;
}
