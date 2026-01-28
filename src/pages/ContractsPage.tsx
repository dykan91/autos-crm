import { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    Form,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import { PlusOutlined, FilePdfOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';

import { supabase } from '../lib/supabase';

type CarOption = { id: string; label: string };
type ClientOption = { id: string; label: string };

type CarRowMini = {
    id: string;
    nr: number;
    fahrzeug: string;
    vin: string;
};

type ClientRowMini = {
    id: string;
    nr: number;
    name: string;
    city: string;
    postal_code: string;
    address: string;
};

type ContractRowView = {
    id: string;
    nr: number;
    contract_date: string;
    price: number;
    created_at: string;
    car: CarRowMini | null;
    client: ClientRowMini | null;
};

type ContractFormValues = {
    car_id: string;
    client_id: string;
    price: number;
};

function sellerInfo() {
    // позже можно вынести в настройки
    return {
        name: 'Auto CRM',
        city: 'Dresden',
        address: '—',
        phone: '—',
    };
}

function generateContractPDF(row: ContractRowView) {
    const pdf = new jsPDF();

    const s = sellerInfo();
    const car = row.car;
    const cl = row.client;

    if (!car || !cl) {
        message.error('Нет данных для PDF (машина/клиент)');
        return;
    }

    const y = (n: number) => 10 + n;

    pdf.setFontSize(16);
    pdf.text('Kaufvertrag (Fahrzeug)', 14, y(10));

    pdf.setFontSize(11);
    pdf.text(`Vertrag Nr: ${row.nr}`, 14, y(24));
    pdf.text(`Datum: ${row.contract_date}`, 14, y(32));

    // Verkäufer
    pdf.setFontSize(12);
    pdf.text('Verkäufer:', 14, y(48));
    pdf.setFontSize(11);
    pdf.text(`${s.name}`, 20, y(56));
    pdf.text(`${s.address}`, 20, y(64));
    pdf.text(`${s.city}`, 20, y(72));
    pdf.text(`Tel: ${s.phone}`, 20, y(80));

    // Käufer
    pdf.setFontSize(12);
    pdf.text('Käufer:', 110, y(48));
    pdf.setFontSize(11);
    pdf.text(`${cl.name}`, 116, y(56));
    pdf.text(`${cl.address}`, 116, y(64));
    pdf.text(`${cl.postal_code} ${cl.city}`, 116, y(72));

    // Fahrzeug
    pdf.setFontSize(12);
    pdf.text('Fahrzeug:', 14, y(100));
    pdf.setFontSize(11);
    pdf.text(`Nr: ${car.nr}`, 20, y(108));
    pdf.text(`Bezeichnung: ${car.fahrzeug}`, 20, y(116));
    pdf.text(`VIN: ${car.vin}`, 20, y(124));

    // Preis
    pdf.setFontSize(12);
    pdf.text('Kaufpreis:', 14, y(146));
    pdf.setFontSize(11);
    const priceStr = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(row.price);
    pdf.text(priceStr, 20, y(154));

    // Подписи
    pdf.setFontSize(11);
    pdf.text('Unterschriften:', 14, y(180));
    pdf.line(14, y(205), 90, y(205));
    pdf.line(110, y(205), 196, y(205));
    pdf.text('Verkäufer', 14, y(212));
    pdf.text('Käufer', 110, y(212));

    pdf.save(`vertrag_${row.nr}.pdf`);
}

export function ContractsPage() {
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [cars, setCars] = useState<CarOption[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [contracts, setContracts] = useState<ContractRowView[]>([]);

    const [form] = Form.useForm<ContractFormValues>();

    const loadContracts = useCallback(async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('contracts')
            .select(
                `
        id, nr, contract_date, price, created_at,
        car:cars ( id, nr, fahrzeug, vin ),
        client:clients ( id, nr, name, city, postal_code, address )
      `
            )
            .order('nr', { ascending: false });

        if (error) {
            message.error(error.message);
            setContracts([]);
        } else {
            setContracts((data ?? []) as unknown as ContractRowView[]);
        }

        setLoading(false);
    }, []);

    const loadOptions = useCallback(async () => {
        const carsRes = await supabase
            .from('cars')
            .select('id,nr,fahrzeug,vin,status')
            .neq('status', 'Sold')
            .order('nr', { ascending: true });

        const clientsRes = await supabase
            .from('clients')
            .select('id,nr,name,city,postal_code,address')
            .order('nr', { ascending: true });

        if (carsRes.error) message.error(carsRes.error.message);
        if (clientsRes.error) message.error(clientsRes.error.message);

        const carsOptions: CarOption[] = (carsRes.data ?? []).map((c) => ({
            id: c.id as string,
            label: `#${c.nr} — ${c.fahrzeug} (${c.vin})`,
        }));

        const clientOptions: ClientOption[] = (clientsRes.data ?? []).map((cl) => ({
            id: cl.id as string,
            label: `#${cl.nr} — ${cl.name} — ${cl.postal_code} ${cl.city}, ${cl.address}`,
        }));

        setCars(carsOptions);
        setClients(clientOptions);
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('contracts')
                .select(
                    `
          id, nr, contract_date, price, created_at,
          car:cars ( id, nr, fahrzeug, vin ),
          client:clients ( id, nr, name, city, postal_code, address )
        `
                )
                .order('nr', { ascending: false });

            if (cancelled) return;

            if (error) {
                message.error(error.message);
                setContracts([]);
            } else {
                setContracts((data ?? []) as unknown as ContractRowView[]);
            }
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const openCreate = useCallback(async () => {
        await loadOptions();
        form.resetFields();
        setCreateOpen(true);
    }, [form, loadOptions]);

    const createContract = useCallback(
        async (values: ContractFormValues) => {
            setCreating(true);
            const today = new Date().toISOString().slice(0, 10);

            const { data: contract, error: contractError } = await supabase
                .from('contracts')
                .insert({
                    car_id: values.car_id,
                    client_id: values.client_id,
                    price: values.price,
                    contract_date: today,
                })
                .select('nr')
                .single();

            if (contractError) {
                message.error(contractError.message);
                setCreating(false);
                return;
            }

            const { error: carError } = await supabase
                .from('cars')
                .update({
                    status: 'Sold',
                    verkaufspreis: values.price,
                    verkaufsdatum: today,
                })
                .eq('id', values.car_id);

            if (carError) {
                message.error(`Договор создан, но машина не обновилась: ${carError.message}`);
                setCreating(false);
                setCreateOpen(false);
                await loadContracts();
                return;
            }

            message.success(`Договор #${contract?.nr ?? ''} создан`);
            setCreating(false);
            setCreateOpen(false);
            await loadContracts();
        },
        [loadContracts]
    );

    const columns: ColumnsType<ContractRowView> = [
        { title: 'Nr', dataIndex: 'nr', width: 80 },
        { title: 'Дата', dataIndex: 'contract_date', width: 120 },
        {
            title: 'Сумма',
            dataIndex: 'price',
            width: 160,
            render: (v: number) =>
                new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v),
        },
        {
            title: 'Машина',
            key: 'car',
            render: (_: unknown, row) => {
                const c = row.car;
                if (!c) return '-';
                return (
                    <div>
                        <div>
                            <b>#{c.nr}</b> — {c.fahrzeug}
                        </div>
                        <div style={{ opacity: 0.7, fontSize: 12 }}>VIN: {c.vin}</div>
                    </div>
                );
            },
        },
        {
            title: 'Покупатель',
            key: 'client',
            render: (_: unknown, row) => {
                const cl = row.client;
                if (!cl) return '-';
                return (
                    <div>
                        <div>
                            <b>#{cl.nr}</b> — {cl.name}
                        </div>
                        <div style={{ opacity: 0.7, fontSize: 12 }}>
                            {cl.postal_code} {cl.city}, {cl.address}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'PDF',
            key: 'pdf',
            width: 110,
            render: (_: unknown, row) => (
                <Button icon={<FilePdfOutlined />} onClick={() => generateContractPDF(row)}>
                    PDF
                </Button>
            ),
        },
    ];

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Договоры
                </Typography.Title>

                <Button type="primary" icon={<PlusOutlined />} onClick={() => void openCreate()}>
                    Создать договор
                </Button>
            </Space>

            <div style={{ height: 16 }} />

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={contracts}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
            />

            <Modal
                title="Создать договор"
                open={createOpen}
                confirmLoading={creating}
                onCancel={() => setCreateOpen(false)}
                onOk={() => form.submit()}
                okText="Сохранить"
            >
                <ContractForm form={form} cars={cars} clients={clients} onFinish={createContract} />
            </Modal>
        </Card>
    );
}

function ContractForm({
                          form,
                          cars,
                          clients,
                          onFinish,
                      }: {
    form: FormInstance<ContractFormValues>;
    cars: CarOption[];
    clients: ClientOption[];
    onFinish: (v: ContractFormValues) => void;
}) {
    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="car_id" label="Машина" rules={[{ required: true }]}>
                <Select
                    showSearch
                    placeholder="Выбери машину (не проданную)"
                    options={cars.map((c) => ({ value: c.id, label: c.label }))}
                    filterOption={(input, option) =>
                        (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                />
            </Form.Item>

            <Form.Item name="client_id" label="Клиент" rules={[{ required: true }]}>
                <Select
                    showSearch
                    placeholder="Выбери клиента"
                    options={clients.map((c) => ({ value: c.id, label: c.label }))}
                    filterOption={(input, option) =>
                        (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                />
            </Form.Item>

            <Form.Item name="price" label="Сумма продажи (EUR)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={100} />
            </Form.Item>
        </Form>
    );
}
