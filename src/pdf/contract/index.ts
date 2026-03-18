import jsPDF from 'jspdf';
import type { ContractRowView } from '../../pages/ContractsPage';

import { renderHeader } from './template/header';
import { renderFooter } from './template/footer';
import { renderClientInvoiceCar } from './template/clientInvoiceCar';
import { renderPriceBlock } from './template/priceBlock';
import { renderTextsBlock } from './template/texts';
import { renderChoicesBlock, renderExportBlock } from './template/choicesBlock';
import { renderKaufvertragIntro } from './template/kaufvertragIntro';
import { renderSignatures } from './template/signatures';
import { mapRowToContractPdfData } from './mapRowToData';

export function generateContractPdf(row: ContractRowView) {
    if (!row?.car || !row?.client) return;

    const data = mapRowToContractPdfData(row);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    // ─────────────────────────────────────────────────────
    // СТРАНИЦА 1 — Rechnung
    // Шапка · Счёт · Машина · Цена · Текст ответственности · Экспорт · Реквизиты
    // ─────────────────────────────────────────────────────
    const y1 = renderHeader(pdf);
    renderFooter(pdf);                          // реквизиты в футере

    const y2 = renderClientInvoiceCar(pdf, data, y1);
    const y3 = renderPriceBlock(pdf, row, y2);
    const y4 = renderTextsBlock(pdf, y3);       // большой текст ответственности
    renderExportBlock(pdf, row, y4);            // куда экспортируется

    // ─────────────────────────────────────────────────────
    // СТРАНИЦА 2 — Kaufvertrag
    // Шапка · Продавец/Покупатель · Машина · Состояние · Что получает · Подписи
    // БЕЗ реквизитов
    // ─────────────────────────────────────────────────────
    pdf.addPage();

    const y5 = renderHeader(pdf);
    // renderFooter НЕ вызываем — реквизитов нет

    const y6 = renderKaufvertragIntro(pdf, data, row, y5);
    const y7 = renderChoicesBlock(pdf, row, y6); // состояние + что получает покупатель
    renderSignatures(pdf, y7 + 4);

    pdf.save(`vertrag_${row.nr ?? 'unknown'}.pdf`);
}