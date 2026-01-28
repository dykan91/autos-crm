export type CarStatus = 'In Stock' | 'Sold' | 'Reserved';

export type CarRow = {
    id: string;
    nr: number;
    kaufdatum: string;      // 'YYYY-MM-DD'
    fahrzeug: string;
    vin: string;
    einkaufspreis: number;
    verkaufspreis: number | null;
    verkaufsdatum: string | null;
    status: string;
    created_at: string;
};
