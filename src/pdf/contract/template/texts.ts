import jsPDF from 'jspdf';
import { L, R, setFont, drawWrapped } from './utils';

export const LIABILITY_TEXT = `Das Kraftfahrzeug wird unter Ausschluss der Rechts- und Sachmängelhaftung verkauft, soweit nicht nachfolgend eine einjährige Gewährleistung übernommen wird. Dieser Ausschluss gilt nicht für Schadenersatzansprüche aus Rechts- und Sachmängelhaftung, die auf einer grob fahrlässigen oder vorsätzlichen Verletzung von Pflichten des Verkäufers beruhen sowie bei der Verletzung von Leben, Körper und Gesundheit oder Bastlerfahrzeuge. Gegebenenfalls noch bestehende Ansprüche gegenüber Dritten aus Sachmängelhaftung werden an den Käufer abgetreten.`;

export function renderTextsBlock(pdf: jsPDF, startY: number) {
    let y = startY;

    setFont(pdf, 'normal', 7.5);
    y = drawWrapped(pdf, LIABILITY_TEXT, L, y, R - L, 4.5);

    y += 6;


    return y;
}


