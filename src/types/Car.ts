export type CarStatus = 'In Stock' | 'Sold' | 'Reserved';

export type CarRow = {
    id: string;
    nr: number;
    kaufdatum: string;      // 'YYYY-MM-DD'
    fahrzeug: string;
    vin: string;
    kfz_brief_nr: string | null;
    ez: string | null;
    farbe: string | null;
    einkaufspreis: number;
    verkaufspreis: number | null;
    verkaufsdatum: string | null;
    status: string;
    created_at: string;
};
