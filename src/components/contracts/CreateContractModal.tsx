import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { supabase } from '../../lib/supabase';

export type SellerStatementKey =
    | 'bastlerfahrzeug'
    | 'no_accident'
    | 'no_other_damage'
    | 'has_damage';

export type ExportDestination = 'inland' | 'eu' | 'third';

type CarOption = { id: string; label: string };
type ClientOption = { id: string; label: string };

export type ContractCreateValues = {
    contract_date: dayjs.Dayjs | null;
    car_id: string;
    client_id: string;
    price: number;
    tax_included: boolean;
    seller_statement_keys: SellerStatementKey[];
    buyer_receives_flags: string[];
    keys_count?: number;
    export_destination: ExportDestination;
    eu_with_tax?: boolean;
    eu_tax_number?: string;
    third_with_customs?: boolean;
    third_customs_number?: string;
};

const SELLER_STATEMENTS: { value: SellerStatementKey; label: string }[] = [
    {
        value: 'bastlerfahrzeug',
        label: 'als Bastlerfahrzeug bzw. fahrbarer Ersatzteilträger zum Wiederaufbau angeboten wurde und mit Hänger abtransportiert werden muss.',
    },
    { value: 'no_accident', label: 'Keinen Unfallschaden' },
    { value: 'no_other_damage', label: 'keine sonstigen Beschädigungen' },
    { value: 'has_damage', label: 'lediglich folgende Unfallschäden oder sonstige Beschädigung hatte: - siehe Rückseite' },
];

const BUYER_RECEIVES_OPTIONS = [
    'Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung',
    'des Kfz mit Schlüsseln',
    'bei stillgelegtem Kfz der Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung (ggf. Stilllegungsbescheinigung)',
] as const;

export function CreateContractModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => Promise<void> | void;
}) {
    const { t } = useTranslation();
    const [creating, setCreating] = useState(false);
    const [cars, setCars] = useState<CarOption[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [form] = Form.useForm<ContractCreateValues>();

    const loadOptions = useCallback(async () => {
        const carsRes = await supabase
            .from('cars')
            .select('id,nr,fahrzeug,vin,status')
            .neq('status', 'Sold')
            .order('nr', { ascending: true });

        const clientsRes = await supabase
            .from('clients')
            .select('id,nr,name,postal_code,city,address')
            .order('nr', { ascending: true });

        if (carsRes.error) message.error(carsRes.error.message);
        if (clientsRes.error) message.error(clientsRes.error.message);

        type RawCar = { id: string; nr: number; fahrzeug: string; vin: string };
        type RawClient = { id: string; nr: number; name: string; postal_code: string; city: string; address: string };

        setCars(
            (carsRes.data ?? []).map((c: RawCar) => ({
                id: c.id,
                label: `#${c.nr} — ${c.fahrzeug} (${c.vin})`,
            }))
        );

        setClients(
            (clientsRes.data ?? []).map((c: RawClient) => ({
                id: c.id,
                label: `#${c.nr} — ${c.name} — ${c.postal_code} ${c.city}, ${c.address}`,
            }))
        );
    }, []);

    useEffect(() => {
        if (!open) return;

        void (async () => {
            await loadOptions();
            const today = new Date().toISOString().slice(0, 10);

            form.resetFields();
            form.setFieldsValue({
                contract_date: dayjs(today),
                tax_included: true,
                seller_statement_keys: ['no_accident'],
                buyer_receives_flags: [
                    BUYER_RECEIVES_OPTIONS[0],
                    BUYER_RECEIVES_OPTIONS[1],
                ],
                keys_count: 2,
                export_destination: 'inland',
                eu_with_tax: false,
                third_with_customs: false,
            });
        })();
    }, [open, form, loadOptions]);

    const dest = Form.useWatch('export_destination', form) as ExportDestination | undefined;
    const buyerFlags = Form.useWatch('buyer_receives_flags', form) as string[] | undefined;

    const keySelected = useMemo(() => {
        return (buyerFlags ?? []).includes(BUYER_RECEIVES_OPTIONS[1]);
    }, [buyerFlags]);

    const createContract = useCallback(
        async (v: ContractCreateValues) => {
            if (!v.seller_statement_keys?.length) {
                message.error(t('contracts.fields.sellerStatementRequired'));
                return;
            }

            setCreating(true);
            try {
                if (v.export_destination === 'eu') {
                    if (v.eu_with_tax && !v.eu_tax_number?.trim()) {
                        message.error(t('contracts.fields.euTaxRequired'));
                        return;
                    }
                }

                if (v.export_destination === 'third') {
                    if (v.third_with_customs && !v.third_customs_number?.trim()) {
                        message.error(t('contracts.fields.thirdCustomsRequired'));
                        return;
                    }
                }

                const contractDateStr = v.contract_date
                    ? v.contract_date.format('YYYY-MM-DD')
                    : new Date().toISOString().slice(0, 10);

                const { data: contract, error: contractError } = await supabase
                    .from('contracts')
                    .insert({
                        contract_date: contractDateStr,
                        car_id: v.car_id,
                        client_id: v.client_id,
                        price: v.price,
                        tax_included: v.tax_included,
                        // Сохраняем массив как JSON-строку в той же колонке
                        seller_statement_key: JSON.stringify(v.seller_statement_keys),
                        buyer_receives_flags: v.buyer_receives_flags ?? [],
                        keys_count: v.keys_count ?? null,
                        export_destination: v.export_destination,
                        eu_with_tax: v.export_destination === 'eu' ? Boolean(v.eu_with_tax) : null,
                        eu_tax_number: v.export_destination === 'eu' && v.eu_with_tax ? (v.eu_tax_number ?? null) : null,
                        third_with_customs: v.export_destination === 'third' ? Boolean(v.third_with_customs) : null,
                        third_customs_number:
                            v.export_destination === 'third' && v.third_with_customs
                                ? (v.third_customs_number ?? null)
                                : null,
                    })
                    .select('nr')
                    .single();

                if (contractError) {
                    message.error(contractError.message);
                    return;
                }

                const { error: carError } = await supabase
                    .from('cars')
                    .update({
                        status: 'Sold',
                        verkaufspreis: v.price,
                        verkaufsdatum: contractDateStr,
                    })
                    .eq('id', v.car_id);

                if (carError) {
                    message.error(t('contracts.carNotUpdated', { error: carError.message }));
                } else {
                    message.success(t('contracts.created', { nr: contract?.nr ?? '' }));
                }

                onClose();
                await onCreated();
            } finally {
                setCreating(false);
            }
        },
        [onClose, onCreated, t]
    );

    return (
        <Modal
            title={t('contracts.createModal')}
            open={open}
            confirmLoading={creating}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText={t('common.save')}
        >
            <Form form={form} layout="vertical" onFinish={createContract}>
                <Form.Item name="contract_date" label={t('contracts.fields.date')} rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="car_id" label={t('contracts.fields.car')} rules={[{ required: true }]}>
                    <Select showSearch options={cars.map((c) => ({ value: c.id, label: c.label }))} />
                </Form.Item>

                <Form.Item name="client_id" label={t('contracts.fields.client')} rules={[{ required: true }]}>
                    <Select showSearch options={clients.map((c) => ({ value: c.id, label: c.label }))} />
                </Form.Item>

                <Form.Item name="price" label={t('contracts.fields.price')} rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={100} />
                </Form.Item>

                <Form.Item name="tax_included" label={t('contracts.fields.taxIncluded')} rules={[{ required: true }]}>
                    <Select options={[
                        { value: true, label: t('common.yes') },
                        { value: false, label: t('common.no') },
                    ]} />
                </Form.Item>

                {/* Мультивыбор состояния машины */}
                <Form.Item
                    name="seller_statement_keys"
                    label={t('contracts.fields.sellerStatement')}
                    rules={[{ required: true, type: 'array', min: 1, message: t('contracts.fields.sellerStatementRequired') }]}
                >
                    <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {SELLER_STATEMENTS.map((s) => (
                            <Checkbox key={s.value} value={s.value}>
                                {s.label}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Form.Item>

                <Form.Item name="buyer_receives_flags" label={t('contracts.fields.buyerReceives')}>
                    <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {BUYER_RECEIVES_OPTIONS.map((text) => (
                            <Checkbox key={text} value={text}>{text}</Checkbox>
                        ))}
                    </Checkbox.Group>
                </Form.Item>

                {keySelected && (
                    <Form.Item
                        name="keys_count"
                        label={t('contracts.fields.keysCount')}
                        rules={[{ required: true, message: t('contracts.fields.keysRequired') }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} step={1} />
                    </Form.Item>
                )}

                <Form.Item name="export_destination" label={t('contracts.fields.exportDest')} rules={[{ required: true }]}>
                    <Select
                        options={[
                            { value: 'inland', label: 'Inland' },
                            { value: 'eu', label: 'EU-Land' },
                            { value: 'third', label: 'Drittland' },
                        ]}
                    />
                </Form.Item>

                {dest === 'eu' && (
                    <>
                        <Form.Item name="eu_with_tax" label={t('contracts.fields.euWithTax')} rules={[{ required: true }]}>
                            <Select options={[
                                { value: true, label: t('contracts.exportOptions.mitSteuer') },
                                { value: false, label: t('contracts.exportOptions.ohneSteuer') },
                            ]} />
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {() =>
                                form.getFieldValue('eu_with_tax') === true ? (
                                    <Form.Item name="eu_tax_number" label={t('contracts.fields.euTaxNumber')} rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                    </>
                )}

                {dest === 'third' && (
                    <>
                        <Form.Item name="third_with_customs" label={t('contracts.fields.thirdWithCustoms')} rules={[{ required: true }]}>
                            <Select options={[
                                { value: true, label: t('contracts.exportOptions.mitZoll') },
                                { value: false, label: t('contracts.exportOptions.ohneZoll') },
                            ]} />
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {() =>
                                form.getFieldValue('third_with_customs') === true ? (
                                    <Form.Item name="third_customs_number" label={t('contracts.fields.thirdCustomsNumber')} rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
}