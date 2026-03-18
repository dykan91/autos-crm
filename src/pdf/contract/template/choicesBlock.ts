import jsPDF from 'jspdf';
import { L, R, setFont, text, wrap, drawWrapped } from './utils';
import type { ContractRowView } from '../../../pages/ContractsPage.tsx';

const SELLER_OPTIONS = [
    {
        key: 'bastlerfahrzeug',
        label: 'als Bastlerfahrzeug bzw. fahrbarer Ersatzteilträger zum Wiederaufbau angeboten wurde und mit Hänger abtransportiert werden muss.',
    },
    { key: 'no_accident', label: 'Keinen Unfallschaden' },
    { key: 'no_other_damage', label: 'keine sonstigen Beschädigungen' },
    { key: 'has_damage', label: 'lediglich folgende Unfallschäden oder sonstige Beschädigung hatte: - siehe Rückseite' },
] as const;

const BUYER_RECEIVES = [
    'Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung',
    'des Kfz mit Schlüsseln',
    'bei stillgelegtem Kfz der Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung (ggf. Stilllegungsbescheinigung)',
] as const;

function drawLine(pdf: jsPDF, label: string, x: number, y: number, maxWidth: number, lh: number) {
    setFont(pdf, 'normal', 10);
    const lines = wrap(pdf, label, maxWidth - 8);
    for (const ln of lines) {
        text(pdf, ln, x, y);
        y += lh;
    }
    return y;
}

function s(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v);
}

function drawTwoColSection(
    pdf: jsPDF,
    title: string,
    xLabel: number,
    y: number,
    titleWidth: number,
    titleLh: number,
    renderRight: (yStartRight: number) => number
): number {
    const y0 = y;
    setFont(pdf, 'bold', 11);
    const yAfterTitle = drawWrapped(pdf, title, xLabel, y, titleWidth, titleLh);
    const yAfterRight = renderRight(y0);
    return Math.max(yAfterTitle, yAfterRight);
}

function parseSellerKeys(raw: string | null | undefined): string[] {
    if (!raw) return ['no_accident'];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as string[];
    } catch {
        // старый формат — одиночная строка
    }
    return [raw];
}

// ─────────────────────────────────────────────────────────
// СТРАНИЦА 2 — Kaufvertrag:
// «Der Verkäufer erklärt» + «Der Käufer bestätigt den Empfang»
// ─────────────────────────────────────────────────────────
export function renderChoicesBlock(pdf: jsPDF, row: ContractRowView, startY: number): number {
    let y = startY;
    const xLabel = L;
    const xRight = xLabel + 50;
    const lh = 5.2;
    const titleLh = 6;
    const titleWidth = 50;

    // Verkäufer erklärt
    setFont(pdf, 'bold', 11);
    text(pdf, 'Der Verkäufer erklärt:', xLabel, y);
    setFont(pdf, 'normal', 10);
    y = drawWrapped(pdf, 'dass das Kfz auch in der übrigen Zeit – soweit ihm bekannt –', xRight, y, R - xRight, lh);
    y += 1;

    const chosenKeys = parseSellerKeys(row.seller_statement_key);
    for (const key of chosenKeys) {
        const label = SELLER_OPTIONS.find(x => x.key === key)?.label ?? '';
        if (label.trim()) {
            y = drawLine(pdf, label, xRight, y, R - xRight, lh);
        }
    }

    y += 1;
    y = drawWrapped(pdf, 'Dass das Kfz unverzüglich umgemeldet wird.', xRight, y, R - xRight, lh);
    y += 1;
    y = drawWrapped(pdf, 'Dass das Kfz bis zur vollständigen Bezahlung des Kaufpreises Eigentum des Verkäufers bleibt.', xRight, y, R - xRight, lh);
    y += 3;

    // Käufer bestätigt den Empfang
    y = drawTwoColSection(
        pdf,
        'Der Käufer bestätigt den Empfang:',
        xLabel,
        y,
        titleWidth,
        titleLh,
        (yStart) => {
            setFont(pdf, 'normal', 10);
            const selectedFlags = new Set((row.buyer_receives_flags ?? []) as string[]);
            const keysCount = row.keys_count ?? 2;
            let yy = yStart;
            for (const opt of BUYER_RECEIVES) {
                if (!selectedFlags.has(opt)) continue;
                const label = opt === 'des Kfz mit Schlüsseln'
                    ? `des Kfz mit ${keysCount} Schlüsseln`
                    : opt;
                yy = drawLine(pdf, label, xRight, yy, R - xRight, lh);
            }
            return yy;
        }
    );

    y += 8;
    return y;
}

// ─────────────────────────────────────────────────────────
// СТРАНИЦА 1 — Rechnung:
// «Der Käufer überführt das Fahrzeug in das:»
// ─────────────────────────────────────────────────────────
export function renderExportBlock(pdf: jsPDF, row: ContractRowView, startY: number): number {
    let y = startY;
    const xLabel = L;
    const xRight = xLabel + 50;
    const lh = 5.2;
    const titleLh = 6;
    const titleWidth = 50;

    y = drawTwoColSection(
        pdf,
        'Der Käufer überführt das Fahrzeug in das:',
        xLabel,
        y,
        titleWidth,
        titleLh,
        (yStart) => {
            setFont(pdf, 'normal', 10);
            let yy = yStart;
            const dest = (row.export_destination ?? 'inland') as 'inland' | 'eu' | 'third';

            if (dest === 'inland') {
                return drawLine(
                    pdf,
                    'Inland, wobei der Verkauf gemäß §25a UStG nach der Differenzbesteuerung erfolgt.',
                    xRight, yy, R - xRight, lh
                );
            }

            if (dest === 'eu') {
                yy = drawLine(pdf, 'EU-Land, und erklärt eidesstattlich, dass er das Fahrzeug in das EU-Land ausführt.', xRight, yy, R - xRight, lh);
                if (row.eu_with_tax) {
                    const taxNr = s(row.eu_tax_number ?? '').trim();
                    yy = drawLine(pdf, `mit USt-IdNr.: ${taxNr} - keine USt`, xRight, yy, R - xRight, lh);
                } else {
                    yy = drawLine(pdf, 'USt gemäß § 25a UStG nach Differenzbesteuerung', xRight, yy, R - xRight, lh);
                }
                return yy;
            }

            // dest === 'third'
            yy = drawLine(pdf, 'Drittland,', xRight, yy, R - xRight, lh);
            if (row.third_with_customs) {
                const zoll = s(row.third_customs_number ?? '').trim();
                yy = drawLine(pdf, `mit Zollbescheinigung: ${zoll} - keine USt`, xRight, yy, R - xRight, lh);
            } else {
                yy = drawLine(pdf, 'USt gemäß § 25a UStG nach Differenzbesteuerung', xRight, yy, R - xRight, lh);
            }
            return yy;
        }
    );

    y += 8;
    return y;
}