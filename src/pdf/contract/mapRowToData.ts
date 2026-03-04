import type { ContractPdfData } from './types';
import { formatDateDE } from './template/utils';
import type {ContractRowView} from '../../pages/ContractsPage.tsx';

export function mapRowToContractPdfData(row: ContractRowView): ContractPdfData {
    const car = row.car!;
    const cl = row.client!;

    return {
        invoiceNr: String(row.nr),
        cityDateRight: `Dresden ${formatDateDE(row.contract_date)}`,

        client: {
            name: cl.name ?? '',
            address: cl.address ?? '',
            postalCity: `${cl.postal_code ?? ''} ${cl.city ?? ''}`.trim(),
        },

        car: {
            title: car.fahrzeug ?? '',
            vin: car.vin ?? '',
            kfzBriefNr: car.kfz_brief_nr ?? '',
            ez: formatDateDE(car.ez ?? null),
            color: car.farbe ?? '',
        },
    };
}
