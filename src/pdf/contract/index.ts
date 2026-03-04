import jsPDF from 'jspdf';
import type { ContractRowView } from '../../pages/ContractsPage';

import { renderHeader } from './template/header';
import { renderFooter } from './template/footer';
import { renderClientInvoiceCar } from './template/clientInvoiceCar';
import { renderPriceBlock } from './template/priceBlock';
import { renderTextsBlock } from './template/texts';
import { renderChoicesBlock } from './template/choicesBlock';
import {mapRowToContractPdfData} from './mapRowToData.ts';
// import { renderSignatures } from './template/signatures'; // если нет — оставь как было внутри index

export function generateContractPdf(row: ContractRowView) {

    if (!row?.car || !row?.client) return;
    const data = mapRowToContractPdfData(row);

    console.log('PDF DATA:', data);
    console.log('row:', row);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    const yAfterHeader = renderHeader(pdf);
    renderFooter(pdf);

    const yAfterCar = renderClientInvoiceCar(pdf, data, yAfterHeader);

    const yAfterPrice = renderPriceBlock(pdf, row, yAfterCar);

    const yAfterTexts = renderTextsBlock(pdf, yAfterPrice);
    renderChoicesBlock(pdf, row, yAfterTexts);

    // подписи можно как раньше (внизу страницы)

    pdf.save(`vertrag_${row.nr ?? 'unknown'}.pdf`);
}
