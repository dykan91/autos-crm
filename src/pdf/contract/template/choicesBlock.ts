import jsPDF from 'jspdf';
import { L, R, setFont, text, wrap, drawWrapped } from './utils';
import type {ContractRowView} from '../../../pages/ContractsPage.tsx';

const SELLER_OPTIONS = [
    {
        key: 'bastlerfahrzeug',
        label:
            'als Bastlerfahrzeug bzw. fahrbarer Ersatzteilträger zum Wiederaufbau angeboten wurde und mit Hänger abtransportiert werden muss.',
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

function drawCheckedLine(
    pdf: jsPDF,
    label: string,
    x: number,
    y: number,
    maxWidth: number,
    lh: number
) {
    const tx = x;

    setFont(pdf, 'normal', 10);
    const lines = wrap(pdf, label, maxWidth - 8);

    for (const ln of lines) {
        text(pdf, ln, tx, y);
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
    _xRight: number,
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

export function renderChoicesBlock(pdf: jsPDF, row: ContractRowView, startY: number) {
    let y = startY;
    const xLabel = L;
    const xRight = xLabel + 50;
    const lh = 5.2;

    setFont(pdf, 'bold', 11);
    text(pdf, 'Der Verkäufer erklärt:', xLabel, y);
    setFont(pdf, 'normal', 10);
    y = drawWrapped(pdf, 'dass das Kfz auch in der übrigen Zeit – soweit ihm bekannt –', xRight, y, R - xRight, lh);
    y += 1;

    const chosenKey = row.seller_statement_key ?? 'no_accident';
    const chosenLabel =
        SELLER_OPTIONS.find(x => x.key === chosenKey)?.label ?? '';

    if (chosenLabel.trim()) {
        y = drawCheckedLine(pdf, chosenLabel, xRight, y, R - xRight, lh);
    }

    y += 1;

    y = drawWrapped(pdf, 'Dass das Kfz unverzüglich umgemeldet wird.', xRight, y, R - xRight, lh);

    y += 1;

    y = drawWrapped(pdf, 'Dass das Kfz bis zur vollständigen Bezahlung des Kaufpreises Eigentum des Verkäufers bleibt.', xRight, y, R - xRight, lh);
    y += 3;
    const titleLh = 6;
    const titleWidth = 50;


    y = drawTwoColSection(
        pdf,
        'Der Käufer bestätigt den Empfang:',
        xLabel,
        xRight,
        y,
        titleWidth,
        titleLh,
        (yStartRight) => {
            setFont(pdf, 'normal', 10);

            const selectedFlags = new Set((row.buyer_receives_flags ?? []) as string[]);
            const keysCount = row.keys_count ?? 2;

            let yy = yStartRight;

            for (const opt of BUYER_RECEIVES) {
                if (!selectedFlags.has(opt)) continue;

                let label = opt;
                if (opt === 'des Kfz mit Schlüsseln') {
                    // @ts-ignore
                    label = `des Kfz mit ${keysCount} Schlüsseln`;
                }

                yy = drawCheckedLine(pdf, label, xRight, yy, R - xRight, lh);
            }

            return yy;
        }
    );

    y += 3;

    y = drawTwoColSection(
        pdf,
        'Der Käufer überführt das Fahrzeug in das:',
        xLabel,
        xRight,
        y,
        titleWidth,
        titleLh,
        (yStartRight) => {
            setFont(pdf, 'normal', 10);

            let yy = yStartRight;
            const lh = 5.2;

            const dest = (row.export_destination ?? 'inland') as 'inland' | 'eu' | 'third';

            if (dest === 'inland') {
                yy = drawCheckedLine(
                    pdf,
                    'Inland, wobei der Verkauf gemäß §25a UStG nach der Differenzbesteuerung erfolgt.',
                    xRight,
                    yy,
                    R - xRight,
                    lh
                );
                return yy;
            }

            if (dest === 'eu') {
                yy = drawCheckedLine(
                    pdf,
                    'EU-Land, und erklärt eidesstattlich, dass er das Fahrzeug in das EU-Land ausführt.',
                    xRight,
                    yy,
                    R - xRight,
                    lh
                );

                const withTax = Boolean(row.eu_with_tax);
                if (withTax) {
                    const taxNr = s(row.eu_tax_number ?? '').trim();
                    yy = drawCheckedLine(pdf, `mit USt-IdNr.: ${taxNr} - keine USt`, xRight, yy, R - xRight, lh);
                } else {
                    yy = drawCheckedLine(pdf, 'USt gemäß § 25a UStG nach Differenzbesteuerung', xRight, yy, R - xRight, lh);
                }

                return yy;
            }

            // dest === 'third'
            yy = drawCheckedLine(pdf, 'Drittland,', xRight, yy, R - xRight, lh);

            const withCustoms = Boolean(row.third_with_customs);
            if (withCustoms) {
                const zoll = s(row.third_customs_number ?? '').trim();
                yy = drawCheckedLine(pdf, `mit Zollbescheinigung: ${zoll} - keine USt`, xRight, yy, R - xRight, lh);
            } else {
                yy = drawCheckedLine(pdf, 'USt gemäß § 25a UStG nach Differenzbesteuerung', xRight, yy, R - xRight, lh);
            }

            return yy;
        }
    );

    y += 8;
//
//     setFont(pdf, 'bold', 11);
//     text(pdf, 'Der Verkäufer erklärt:', L, y);
//     y += 6;
//
//     setFont(pdf, 'normal', 10);
//     const chosenKey = row.seller_statement_key ?? 'no_accident';
//     const chosenLabel = SELLER_OPTIONS.find((x) => x.key === chosenKey)?.label ?? '';
//     if (chosenLabel.trim()) {
//         y = drawBulletLine(pdf, chosenLabel, L, y, R - L, 5.2);
//     }
//     y += 3;
//
//     setFont(pdf, 'bold', 11);
//     text(pdf, 'Der Verkäufer erklärt:', L, y);
//     y += 6;
//
//     setFont(pdf, 'normal', 10);
//     y = drawWrapped(pdf, 'Dass das Kfz unverzüglich umgemeldet wird.', L, y, R - L, 5.2);
//     y += 1;
//     y = drawWrapped(
//         pdf,
//         'Dass das Kfz bis zur vollständigen Bezahlung des Kaufpreises Eigentum des Verkäufers bleibt.',
//         L,
//         y,
//         R - L,
//         5.2
//     );
//     y += 6;
//
//     // ===== Käufer bestätigt den Empfang (только выбранные) =====
//     setFont(pdf, 'bold', 11);
//     text(pdf, 'Der Käufer bestätigt den Empfang:', L, y);
//     y += 6;
//
//     setFont(pdf, 'normal', 10);
//     const selectedFlags = new Set((row.buyer_receives_flags ?? []) as string[]);
//     const keysCount = row.keys_count ?? 2;
//
//     for (const opt of BUYER_RECEIVES) {
//         if (!selectedFlags.has(opt)) continue;
//
//         let label = opt;
//         if (opt === 'des Kfz mit Schlüsseln') {
//             label = `des Kfz mit ${keysCount} Schlüsseln`;
//         }
//
//         y = drawBulletLine(pdf, label, L, y, R - L, 5.2);
//     }
//
//     y += 6;
//
//     // ===== Export block =====
//     setFont(pdf, 'bold', 11);
//     text(pdf, 'Der Käufer überführt das Fahrzeug in das:', L, y);
//     y += 6;
//     setFont(pdf, 'normal', 10);
//
//     const dest = (row.export_destination ?? 'inland') as 'inland' | 'eu' | 'third';
//
//     if (dest === 'inland') {
//         y = drawBulletLine(
//             pdf,
//             'Inland, wobei der Verkauf gemäß §25a UStG nach der Differenzbesteuerung erfolgt.',
//             L,
//             y,
//             R - L,
//             5.2
//         );
//     }
//
//     if (dest === 'eu') {
//         y = drawBulletLine(
//             pdf,
//             'EU-Land, und erklärt eidesstattlich, dass er das Fahrzeug in das EU-Land ausführt.',
//             L,
//             y,
//             R - L,
//             5.2
//         );
//
//         const withTax = Boolean(row.eu_with_tax);
//         if (withTax) {
//             y = drawBulletLine(pdf, `mit USt-IdNr.: ${s(row.eu_tax_number ?? '').trim()}`, L, y, R - L, 5.2);
//         } else {
//             // как ты хотел: если без USt-IdNr — показываем §25a
//             y = drawBulletLine(pdf, 'ohne USt-IdNr.: §25a', L, y, R - L, 5.2);
//         }
//     }
//
//     if (dest === 'third') {
//         y = drawBulletLine(pdf, 'Drittland,', L, y, R - L, 5.2);
//
//         const withCustoms = Boolean(row.third_with_customs);
//         if (withCustoms) {
//             y = drawBulletLine(pdf, `mit Zollbescheinigung: ${s(row.third_customs_number ?? '').trim()}`, L, y, R - L, 5.2);
//         } else {
//             y = drawBulletLine(pdf, 'ohne Zollbescheinigung: §25', L, y, R - L, 5.2);
//         }
//     }
//
//     y += 8;
    return y;
}
