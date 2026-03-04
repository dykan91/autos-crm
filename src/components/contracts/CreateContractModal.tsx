import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Input, InputNumber, Modal, Select, Space, message } from 'antd';
import type { FormInstance } from 'antd';

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
    contract_date: string; // YYYY-MM-DD (предзаполнено)

    car_id: string;
    client_id: string;

    price: number;
    tax_included: boolean; // налоги включать или нет

    seller_statement_key: SellerStatementKey;

    buyer_receives_flags: string[];
    keys_count?: number;

    export_destination: ExportDestination;

    // EU
    eu_with_tax?: boolean; // со steuer?
    eu_tax_number?: string;

    // Third country
    third_with_customs?: boolean; // с цоль?
    third_customs_number?: string;
};

const SELLER_STATEMENTS: { value: SellerStatementKey; label: string }[] = [
    {
        value: 'bastlerfahrzeug',
        label:
            'als Bastlerfahrzeug bzw. fahrbarer Ersatzteilträger zum Wiederaufbau angeboten wurde und mit Hänger abtransportiert werden muss.',
    },
    { value: 'no_accident', label: 'Keinen Unfallschaden' },
    { value: 'no_other_damage', label: 'keine sonstigen Beschädigungen' },
    { value: 'has_damage', label: 'lediglich folgende Unfallschäden oder sonstige Beschädigung hatte: - siehe Rückseite' },
];

const BUYER_RECEIVES_OPTIONS = [
    'Zulassungsbescheinigung Teil 1, Teil 2 und der Bescheinigung über die letzte Haupt- und Abgasuntersuchung',
    'des Kfz mit Schlüsseln', // ⚠️ количество ключей будет добавлено в PDF
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

        setCars(
            (carsRes.data ?? []).map((c: any) => ({
                id: c.id,
                label: `#${c.nr} — ${c.fahrzeug} (${c.vin})`,
            }))
        );

        setClients(
            (clientsRes.data ?? []).map((c: any) => ({
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
                contract_date: today,
                tax_included: true,
                seller_statement_key: 'no_accident',
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
            setCreating(true);
            try {
                // валидации зависят от выбора
                if (v.export_destination === 'eu') {
                    if (v.eu_with_tax) {
                        if (!v.eu_tax_number?.trim()) {
                            message.error('EU-Land: введи Steuer-номер');
                            return;
                        }
                    }
                }

                if (v.export_destination === 'third') {
                    if (v.third_with_customs) {
                        if (!v.third_customs_number?.trim()) {
                            message.error('Drittland: введи Zoll-номер');
                            return;
                        }
                    }
                }

                const { data: contract, error: contractError } = await supabase
                    .from('contracts')
                    .insert({
                        contract_date: v.contract_date,
                        car_id: v.car_id,
                        client_id: v.client_id,
                        price: v.price,
                        tax_included: v.tax_included,

                        seller_statement_key: v.seller_statement_key,

                        buyer_receives_flags: v.buyer_receives_flags ?? [],
                        keys_count: v.keys_count ?? null,

                        export_destination: v.export_destination,

                        eu_with_tax: v.export_destination === 'eu' ? Boolean(v.eu_with_tax) : null,
                        eu_tax_number: v.export_destination === 'eu' && v.eu_with_tax ? (v.eu_tax_number ?? null) : null,

                        third_with_customs: v.export_destination === 'third' ? Boolean(v.third_with_customs) : null,
                        third_customs_number:
                            v.export_destination === 'third' && v.third_with_customs ? (v.third_customs_number ?? null) : null,
                    })
                    .select('nr')
                    .single();

                if (contractError) {
                    message.error(contractError.message);
                    return;
                }

                // пометить машину Sold
                const { error: carError } = await supabase
                    .from('cars')
                    .update({
                        status: 'Sold',
                        verkaufspreis: v.price,
                        verkaufsdatum: v.contract_date,
                    })
                    .eq('id', v.car_id);

                if (carError) {
                    message.error(`Договор создан, но машина не обновилась: ${carError.message}`);
                } else {
                    message.success(`Договор #${contract?.nr ?? ''} создан`);
                }

                onClose();
                await onCreated();
            } finally {
                setCreating(false);
            }
        },
        [onClose, onCreated]
    );

    return (
        <Modal
            title="Создать договор"
            open={open}
            confirmLoading={creating}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText="Сохранить"
        >
            <Form form={form} layout="vertical" onFinish={createContract}>
                <Form.Item name="contract_date" label="Дата" rules={[{ required: true }]}>
                    <Input placeholder="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="car_id" label="Машина" rules={[{ required: true }]}>
                    <Select showSearch options={cars.map((c) => ({ value: c.id, label: c.label }))} />
                </Form.Item>

                <Form.Item name="client_id" label="Клиент" rules={[{ required: true }]}>
                    <Select showSearch options={clients.map((c) => ({ value: c.id, label: c.label }))} />
                </Form.Item>

                <Form.Item name="price" label="Цена (EUR)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={100} />
                </Form.Item>

                <Form.Item name="tax_included" label="Включать налоги?" rules={[{ required: true }]}>
                    <Select options={[{ value: true, label: 'Да' }, { value: false, label: 'Нет' }]} />
                </Form.Item>

                <Form.Item name="seller_statement_key" label="Der Verkäufer erklärt (выбери 1 пункт)" rules={[{ required: true }]}>
                    <Select options={SELLER_STATEMENTS} />
                </Form.Item>

                <Form.Item name="buyer_receives_flags" label="Der Käufer bestätigt den Empfang (чекбоксы)">
                    <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {BUYER_RECEIVES_OPTIONS.map((t) => (
                            <Checkbox key={t} value={t}>
                                {t}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Form.Item>

                {keySelected && (
                    <Form.Item name="keys_count" label="Количество ключей" rules={[{ required: true, message: 'Укажи количество ключей' }]}>
                        <InputNumber style={{ width: '100%' }} min={1} step={1} />
                    </Form.Item>
                )}

                <Form.Item name="export_destination" label="Der Käufer überführt das Fahrzeug in das:" rules={[{ required: true }]}>
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
                        <Form.Item name="eu_with_tax" label="EU-Land: со Steuer?" rules={[{ required: true }]}>
                            <Select options={[{ value: true, label: 'Mit Steuer' }, { value: false, label: 'Ohne Steuer' }]} />
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {() =>
                                form.getFieldValue('eu_with_tax') === true ? (
                                    <Form.Item name="eu_tax_number" label="Steuer-номер" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                    </>
                )}

                {dest === 'third' && (
                    <>
                        <Form.Item name="third_with_customs" label="Drittland: с Zoll?" rules={[{ required: true }]}>
                            <Select options={[{ value: true, label: 'Mit Zoll' }, { value: false, label: 'Ohne Zoll' }]} />
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {() =>
                                form.getFieldValue('third_with_customs') === true ? (
                                    <Form.Item name="third_customs_number" label="Zoll-номер" rules={[{ required: true }]}>
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
