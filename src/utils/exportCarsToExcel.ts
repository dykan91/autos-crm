import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { CarRow } from '../types/Car';

export async function exportCarsToExcel(cars: CarRow[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cars');

    sheet.columns = [
        { header: 'Nr', key: 'nr', width: 6 },
        { header: 'Kaufdatum', key: 'kaufdatum', width: 12 },
        { header: 'Fahrzeug', key: 'fahrzeug', width: 30 },
        { header: 'VIN', key: 'vin', width: 22 },
        { header: 'Einkaufspreis (€)', key: 'einkaufspreis', width: 16 },
        { header: 'Verkaufspreis (€)', key: 'verkaufspreis', width: 16 },
        { header: 'Verkaufsdatum', key: 'verkaufsdatum', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
    ];

    cars.forEach((c) => {
        sheet.addRow({
            nr: c.nr ?? '',
            kaufdatum: c.kaufdatum ?? '',
            fahrzeug: c.fahrzeug ?? '',
            vin: c.vin ?? '',
            einkaufspreis: c.einkaufspreis ?? '',
            verkaufspreis: c.verkaufspreis ?? '',
            verkaufsdatum: c.verkaufsdatum ?? '',
            status: c.status ?? '',
        });
    });

    // 🔹 Форматирование цен
    sheet.getColumn('einkaufspreis').numFmt = '€#,##0.00';
    sheet.getColumn('verkaufspreis').numFmt = '€#,##0.00';

    // 🔹 Заголовки жирные
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
        new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `cars_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
}
