import { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import { PlusOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';

import { supabase } from '../lib/supabase';
import type { CarRow } from '../types/Car';
import { exportCarsToExcel } from '../utils/exportCarsToExcel';

type CarStatus = 'In Stock' | 'Reserved' | 'Sold';

type CarFormValues = {
    kaufdatum: string;
    fahrzeug: string;
    vin: string;

    // NEW (для договора/PDF)
    kfz_brief_nr?: string | null;
    ez?: string | null; // YYYY-MM-DD
    farbe?: string | null;

    einkaufspreis: number;
    verkaufspreis?: number | null;
    verkaufsdatum?: string | null;
    status: CarStatus;
};

const STATUS_ORDER: Record<CarStatus, number> = {
    'In Stock': 0,
    Reserved: 1,
    Sold: 2,
};

function formatMoney(v: number | null | undefined) {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function statusTag(s: CarStatus) {
    if (s === 'In Stock') return <Tag color="green">In Stock</Tag>;
    if (s === 'Reserved') return <Tag color="gold">Reserved</Tag>;
    if (s === 'Sold') return <Tag color="red">Sold</Tag>;
    return <Tag>{s}</Tag>;
}

function CarForm({
                     form,
                     onFinish,
                     mode,
                 }: {
    form: FormInstance<CarFormValues>;
    onFinish: (v: CarFormValues) => void;
    mode: 'create' | 'edit';
}) {
    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="kaufdatum" label="Kaufdatum" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="fahrzeug" label="Fahrzeug" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="vin" label="VIN" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            {/* NEW fields (не выводим в таблицу, только в форме) */}
            <Form.Item name="kfz_brief_nr" label="KFZ-Brief Nr. (optional)">
                <Input placeholder="Напр. XD 548416" />
            </Form.Item>

            <Form.Item
                name="ez"
                label="EZ (Erstzulassung) (optional)"
                extra="Дата первой регистрации (YYYY-MM-DD)"
            >
                <Input placeholder="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="farbe" label="Farbe (optional)">
                <Input placeholder="Напр. Schwarz" />
            </Form.Item>

            <Form.Item name="einkaufspreis" label="Einkaufspreis" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={100} />
            </Form.Item>

            <Form.Item name="verkaufspreis" label="Verkaufspreis">
                <InputNumber style={{ width: '100%' }} min={0} step={100} />
            </Form.Item>

            {mode === 'edit' && (
                <Form.Item name="verkaufsdatum" label="Verkaufsdatum">
                    <Input placeholder="YYYY-MM-DD или пусто" />
                </Form.Item>
            )}

            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select<CarStatus>
                    options={[
                        { value: 'In Stock', label: 'In Stock' },
                        { value: 'Reserved', label: 'Reserved' },
                        { value: 'Sold', label: 'Sold' },
                    ]}
                />
            </Form.Item>
        </Form>
    );
}

export function CarsPage() {
    const [data, setData] = useState<CarRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<CarRow | null>(null);

    const [createForm] = Form.useForm<CarFormValues>();
    const [editForm] = Form.useForm<CarFormValues>();

    const load = useCallback(async () => {
        setLoading(true);

        // select('*') оставляем — новые поля подтянутся автоматически
        const { data, error } = await supabase.from('cars').select('*');

        if (error) {
            console.error(error);
            message.error(error.message);
            setData([]);
            setLoading(false);
            return;
        }

        const rows = ((data ?? []) as CarRow[]).slice().sort((a, b) => {
            const sa = STATUS_ORDER[a.status as CarStatus] ?? 999;
            const sb = STATUS_ORDER[b.status as CarStatus] ?? 999;
            if (sa !== sb) return sa - sb;
            return (a.nr ?? 0) - (b.nr ?? 0);
        });

        setData(rows);
        setLoading(false);
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            const { data, error } = await supabase.from('cars').select('*');

            if (cancelled) return;

            if (error) {
                message.error(error.message);
                setData([]);
            } else {
                const rows = ((data ?? []) as CarRow[]).slice().sort((a, b) => {
                    const sa = STATUS_ORDER[a.status as CarStatus] ?? 999;
                    const sb = STATUS_ORDER[b.status as CarStatus] ?? 999;
                    if (sa !== sb) return sa - sb;
                    return (a.nr ?? 0) - (b.nr ?? 0);
                });
                setData(rows);
            }
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const updateStatus = useCallback(
        async (row: CarRow, nextStatus: CarStatus) => {
            const patch: Partial<CarRow> = { status: nextStatus };

            if (nextStatus === 'Sold' && !(row as any).verkaufsdatum) {
                (patch as any).verkaufsdatum = new Date().toISOString().slice(0, 10);
            }

            const { error } = await supabase.from('cars').update(patch).eq('id', row.id);
            if (error) {
                message.error(error.message);
                return;
            }

            message.success('Статус обновлён');
            await load();
        },
        [load]
    );

    const createCar = useCallback(
        async (values: CarFormValues) => {
            const kaufdatum = values.kaufdatum || new Date().toISOString().slice(0, 10);
            const status: CarStatus = values.status || 'In Stock';

            const { error } = await supabase.from('cars').insert({
                kaufdatum,
                fahrzeug: values.fahrzeug,
                vin: values.vin,

                // NEW
                kfz_brief_nr: values.kfz_brief_nr ?? null,
                ez: values.ez ?? null,
                farbe: values.farbe ?? null,

                einkaufspreis: values.einkaufspreis,
                verkaufspreis: values.verkaufspreis ?? null,
                verkaufsdatum: null,
                status,
            });

            if (error) {
                message.error(error.message);
                return;
            }

            message.success('Машина добавлена');
            setCreateOpen(false);
            createForm.resetFields();
            await load();
        },
        [createForm, load]
    );

    const openEdit = useCallback(
        (row: CarRow) => {
            setEditing(row);
            setEditOpen(true);

            editForm.setFieldsValue({
                kaufdatum: (row as any).kaufdatum,
                fahrzeug: (row as any).fahrzeug,
                vin: (row as any).vin,

                // NEW
                kfz_brief_nr: (row as any).kfz_brief_nr ?? null,
                ez: (row as any).ez ?? null,
                farbe: (row as any).farbe ?? null,

                einkaufspreis: (row as any).einkaufspreis,
                verkaufspreis: (row as any).verkaufspreis ?? null,
                verkaufsdatum: (row as any).verkaufsdatum ?? null,
                status: ((row as any).status as CarStatus) ?? 'In Stock',
            });
        },
        [editForm]
    );

    const saveEdit = useCallback(
        async (values: CarFormValues) => {
            if (!editing) return;

            const { error } = await supabase
                .from('cars')
                .update({
                    kaufdatum: values.kaufdatum,
                    fahrzeug: values.fahrzeug,
                    vin: values.vin,

                    // NEW
                    kfz_brief_nr: values.kfz_brief_nr ?? null,
                    ez: values.ez ?? null,
                    farbe: values.farbe ?? null,

                    einkaufspreis: values.einkaufspreis,
                    verkaufspreis: values.verkaufspreis ?? null,
                    verkaufsdatum: values.verkaufsdatum ?? null,
                    status: values.status,
                })
                .eq('id', editing.id);

            if (error) {
                message.error(error.message);
                return;
            }

            message.success('Сохранено');
            setEditOpen(false);
            setEditing(null);
            await load();
        },
        [editing, load]
    );

    // ВАЖНО: новые поля НЕ добавляем в columns
    const columns: ColumnsType<CarRow> = [
        { title: 'Nr', dataIndex: 'nr', width: 80 },
        { title: 'Kaufdatum', dataIndex: 'kaufdatum', width: 120 },
        { title: 'Fahrzeug', dataIndex: 'fahrzeug' },
        { title: 'VIN', dataIndex: 'vin', width: 220 },
        {
            title: 'Einkaufspreis',
            dataIndex: 'einkaufspreis',
            width: 140,
            render: (v: number) => formatMoney(v),
        },
        {
            title: 'Verkaufspreis',
            dataIndex: 'verkaufspreis',
            width: 140,
            render: (v: number | null) => formatMoney(v),
        },
        {
            title: 'Verkaufsdatum',
            dataIndex: 'verkaufsdatum',
            width: 140,
            render: (v: unknown) => (typeof v === 'string' && v.length ? v : '—'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 200,
            render: (_: unknown, row) => (
                <Space>
                    {statusTag(row.status as CarStatus)}
                    <Select<CarStatus>
                        size="small"
                        value={row.status as CarStatus}
                        style={{ width: 120 }}
                        options={[
                            { value: 'In Stock', label: 'In Stock' },
                            { value: 'Reserved', label: 'Reserved' },
                            { value: 'Sold', label: 'Sold' },
                        ]}
                        onChange={(v) => void updateStatus(row, v)}
                    />
                </Space>
            ),
        },
        {
            title: 'Aktion',
            key: 'action',
            width: 120,
            render: (_: unknown, row) => (
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)}>
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Машины
                </Typography.Title>

                <Space>
                    <Button icon={<DownloadOutlined />} onClick={() => exportCarsToExcel(data)}>
                        Выгрузить в Excel
                    </Button>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setCreateOpen(true);
                            createForm.setFieldsValue({
                                status: 'In Stock',
                                kaufdatum: new Date().toISOString().slice(0, 10),

                                // NEW defaults (optional)
                                kfz_brief_nr: null,
                                ez: null,
                                farbe: null,
                            });
                        }}
                    >
                        Добавить
                    </Button>
                </Space>
            </Space>

            <div style={{ height: 16 }} />

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
            />

            <Modal
                title="Добавить машину"
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                onOk={() => createForm.submit()}
                okText="Создать"
            >
                <CarForm form={createForm} onFinish={createCar} mode="create" />
            </Modal>

            <Modal
                title={`Редактировать машину ${editing?.nr ?? ''}`}
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                onOk={() => editForm.submit()}
                okText="Сохранить"
            >
                <CarForm form={editForm} onFinish={saveEdit} mode="edit" />
            </Modal>
        </Card>
    );
}
