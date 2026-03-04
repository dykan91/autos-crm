export type TaxYesNo = 'yes' | 'no';

export type ClauseKey = 'paragraph_25a' | 'export_poland' | 'no_warranty' | 'custom';
export type PaymentMethod = 'cash' | 'bank_transfer';

export type ExportDestination = 'inland' | 'eu' | 'third' | null;
export type EuVatIdMode = 'with' | 'without' | null;
export type CustomsMode = 'with' | 'without' | null;

export type SellerConditionKey = 'bastlerfahrzeug' | 'no_accident' | 'no_other_damage' | 'has_damage';

export const CONTRACT_CONFIG = {
    seller: {
        name: 'KFZ-Handel Yevhenii Shalashov',
        address: 'Bremer Str. 63',
        city: '01067 Dresden',
        phone: '0171 9086414',
        taxNumber: '203/274/04033',
        vatId: 'DE361605067',
        bank: {
            iban: 'DE51 8505 0300 0221 2765 56',
            bic: 'OSDDDE81XXX',
            bankName: 'Ostsächsische Sparkasse Dresden',
        },
    },

    liabilityText:
        'Das Kraftfahrzeug wird unter Ausschluss der Rechts- und Sachmängelhaftung verkauft, soweit nicht nachfolgend eine einjährige ' +
        'Gewährleistung übernommen wird. Dieser Ausschluss gilt nicht für Schadenersatzansprüche aus Rechts- und Sachmängelhaftung, die ' +
        'auf einer grob fahrlässigen oder vorsätzlichen Verletzung von Pflichten des Verkäufers beruhen sowie bei der Verletzung von Leben, ' +
        'Körper und Gesundheit oder Bastlerfahrzeuge. Gegebenenfalls noch bestehende Ansprüche gegenüber Dritten aus Sachmängelhaftung ' +
        'werden an den Käufer abgetreten.',

    sellerCondition: {
        options: [
            {
                key: 'bastlerfahrzeug',
                label:
                    'als Bastlerfahrzeug bzw. fahrbarer Ersatzteilträger zum Wiederaufbau angeboten wurde und mit Hänger abtransportiert werden muss.',
            },
            { key: 'no_accident', label: 'Keinen Unfallschaden' },
            { key: 'no_other_damage', label: 'keine sonstigen Beschädigungen' },
            {
                key: 'has_damage',
                label: 'lediglich folgende Unfallschäden oder sonstige Beschädigung hatte: - siehe Rückseite',
            },
        ] as const,
        defaultKey: 'no_accident' as const,
    },

    buyerReceives: {
        options: [
            'Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung',
            'des Kfz mit 2 Schlüsseln',
            'bei stillgelegtem Kfz der Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung (ggf. Stilllegungsbescheinigung)',
        ] as const,
    },

    exportTexts: {
        inland: 'Inland, wobei der Verkauf gemäß §25a UStG nach der Differenzbesteuerung erfolgt.',
        eu: 'EU-Land, und erklärt eidesstattlich, dass er das Fahrzeug in das EU-Land ausführt.',
        third: 'Drittland,',
        euVat: {
            with: 'mit USt-IdNr.:',
            without: 'ohne USt-IdNr.:',
        },
        customs: {
            with: 'mit Zollbescheinigung:',
            without: 'ohne Zollbescheinigung:',
        },
    },

    clauses: {
        paragraph_25a:
            'Verkauf erfolgt unter §25a – Gebrauchtgegenstände / Sonderregelung\n' +
            'Verkauf erfolgt unter Ausschluss jeglicher Gewährleistung, Sachmängelhaftung, Garantie etc.\n' +
            'Verkauf für Export nach Polen',

        export_poland:
            '(Ausfuhrlieferung §4 Nr. 1a i. V. m. §6 Abs. 1 Nr. 2 UStG)\n' +
            'Verkauf für Polen',

        no_warranty: 'Der Verkauf erfolgt unter Ausschluss der Sachmängelhaftung.',
    } satisfies Record<Exclude<ClauseKey, 'custom'>, string>,

    defaults: {
        tax_yes_no: 'yes' as TaxYesNo,
        clause_key: 'no_warranty' as ClauseKey,
        payment_method: 'cash' as PaymentMethod,

        handover_time: '11:00',
        seller_condition_key: 'no_accident' as SellerConditionKey,

        keys_count: 2,
        buyer_receives_flags: [
            'Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung',
            'des Kfz mit 2 Schlüsseln',
        ] as string[],

        export_destination: null as ExportDestination,
        eu_vat_id_mode: null as EuVatIdMode,
        customs_mode: null as CustomsMode,
    },

    taxMapping(yesNo: TaxYesNo) {
        if (yesNo === 'yes') return { tax_mode: 'vat_normal' as const, vat_rate: 19 };
        return { tax_mode: 'vat_none' as const, vat_rate: 0 };
    },
} as const;
