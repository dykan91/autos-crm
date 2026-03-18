import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    DatePicker,
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
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { supabase } from '../lib/supabase';
import type { CarRow } from '../types/Car';
import { exportCarsToExcel } from '../utils/exportCarsToExcel';

type CarStatus = 'In Stock' | 'Reserved' | 'Sold';

type CarFormValues = {
    kaufdatum: dayjs.Dayjs | null;
    fahrzeug: string;
    vin: string;
    kfz_brief_nr?: string | null;
    ez?: dayjs.Dayjs | null;
    farbe?: string | null;
    einkaufspreis: number;
    verkaufspreis?: number | null;
    verkaufsdatum?: dayjs.Dayjs | null;
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
    const { t } = useTranslation();

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="kaufdatum" label={t('cars.fields.kaufdatum')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="fahrzeug" label={t('cars.fields.fahrzeug')} rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="vin" label={t('cars.fields.vin')} rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="kfz_brief_nr" label={t('cars.fields.kfzBriefNr')}>
                <Input placeholder={t('cars.placeholders.kfzBriefNr')} />
            </Form.Item>

            <Form.Item name="ez" label={t('cars.fields.ez')} extra={t('cars.fields.ezHint')}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="farbe" label={t('cars.fields.farbe')}>
                <Input placeholder={t('cars.placeholders.farbe')} />
            </Form.Item>

            <Form.Item name="einkaufspreis" label={t('cars.fields.einkaufspreis')} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={100} />
            </Form.Item>

            <Form.Item name="verkaufspreis" label={t('cars.fields.verkaufspreis')}>
                <InputNumber style={{ width: '100%' }} min={0} step={100} />
            </Form.Item>

            {mode === 'edit' && (
                <Form.Item name="verkaufsdatum" label={t('cars.fields.verkaufsdatum')}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
            )}

            <Form.Item name="status" label={t('cars.fields.status')} rules={[{ required: true }]}>
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

function toDateStr(d: dayjs.Dayjs | null | undefined): string | null {
    if (!d || !dayjs.isDayjs(d)) return null;
    return d.format('YYYY-MM-DD');
}

function toDayjs(s: string | null | undefined): dayjs.Dayjs | null {
    if (!s) return null;
    return dayjs(s, 'YYYY-MM-DD');
}

export function CarsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<CarRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<CarStatus | 'all'>('all');

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<CarRow | null>(null);

    const [createForm] = Form.useForm<CarFormValues>();
    const [editForm] = Form.useForm<CarFormValues>();

    const load = useCallback(async () => {
        const { data, error } = await supabase.from('cars').select('*');

        if (error) {
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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { void load(); }, [load]);

    // Фильтрация на клиенте
    const filtered = useMemo(() => {
        let rows = data;
        if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                r.fahrzeug?.toLowerCase().includes(q) ||
                r.vin?.toLowerCase().includes(q)
            );
        }
        return rows;
    }, [data, search, statusFilter]);

    const updateStatus = useCallback(
        async (row: CarRow, nextStatus: CarStatus) => {
            const patch: Partial<CarRow> = { status: nextStatus };
            if (nextStatus === 'Sold' && !row.verkaufsdatum) {
                patch.verkaufsdatum = new Date().toISOString().slice(0, 10);
            }
            const { error } = await supabase.from('cars').update(patch).eq('id', row.id);
            if (error) { message.error(error.message); return; }
            message.success(t('cars.statusUpdated'));
            setLoading(true);
            await load();
        },
        [load, t]
    );

    const createCar = useCallback(
        async (values: CarFormValues) => {
            const { error } = await supabase.from('cars').insert({
                kaufdatum: toDateStr(values.kaufdatum) ?? new Date().toISOString().slice(0, 10),
                fahrzeug: values.fahrzeug,
                vin: values.vin,
                kfz_brief_nr: values.kfz_brief_nr ?? null,
                ez: toDateStr(values.ez),
                farbe: values.farbe ?? null,
                einkaufspreis: values.einkaufspreis,
                verkaufspreis: values.verkaufspreis ?? null,
                verkaufsdatum: null,
                status: values.status || 'In Stock',
            });
            if (error) { message.error(error.message); return; }
            message.success(t('cars.added'));
            setCreateOpen(false);
            createForm.resetFields();
            setLoading(true);
            await load();
        },
        [createForm, load, t]
    );

    const openEdit = useCallback(
        (row: CarRow) => {
            setEditing(row);
            setEditOpen(true);
            editForm.setFieldsValue({
                kaufdatum: toDayjs(row.kaufdatum),
                fahrzeug: row.fahrzeug,
                vin: row.vin,
                kfz_brief_nr: row.kfz_brief_nr ?? null,
                ez: toDayjs(row.ez),
                farbe: row.farbe ?? null,
                einkaufspreis: row.einkaufspreis,
                verkaufspreis: row.verkaufspreis ?? null,
                verkaufsdatum: toDayjs(row.verkaufsdatum),
                status: (row.status as CarStatus) ?? 'In Stock',
            });
        },
        [editForm]
    );

    const saveEdit = useCallback(
        async (values: CarFormValues) => {
            if (!editing) return;
            const { error } = await supabase.from('cars').update({
                kaufdatum: toDateStr(values.kaufdatum) ?? editing.kaufdatum,
                fahrzeug: values.fahrzeug,
                vin: values.vin,
                kfz_brief_nr: values.kfz_brief_nr ?? null,
                ez: toDateStr(values.ez),
                farbe: values.farbe ?? null,
                einkaufspreis: values.einkaufspreis,
                verkaufspreis: values.verkaufspreis ?? null,
                verkaufsdatum: toDateStr(values.verkaufsdatum),
                status: values.status,
            }).eq('id', editing.id);
            if (error) { message.error(error.message); return; }
            message.success(t('common.saved'));
            setEditOpen(false);
            setEditing(null);
            setLoading(true);
            await load();
        },
        [editing, load, t]
    );

    const columns: ColumnsType<CarRow> = useMemo(() => [
        { title: 'Nr', dataIndex: 'nr', width: 70 },
        { title: t('cars.fields.kaufdatum'), dataIndex: 'kaufdatum', width: 120 },
        { title: t('cars.fields.fahrzeug'), dataIndex: 'fahrzeug' },
        { title: t('cars.fields.vin'), dataIndex: 'vin', width: 200 },
        {
            title: t('cars.fields.einkaufspreis'),
            dataIndex: 'einkaufspreis',
            width: 140,
            render: (v: number) => formatMoney(v),
        },
        {
            title: t('cars.fields.verkaufspreis'),
            dataIndex: 'verkaufspreis',
            width: 140,
            render: (v: number | null) => formatMoney(v),
        },
        {
            title: t('cars.fields.verkaufsdatum'),
            dataIndex: 'verkaufsdatum',
            width: 130,
            render: (v: unknown) => (typeof v === 'string' && v.length ? v : '—'),
        },
        {
            title: t('cars.fields.status'),
            dataIndex: 'status',
            width: 210,
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
            title: t('common.actions'),
            key: 'action',
            width: 120,
            render: (_: unknown, row) => (
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)}>
                    {t('common.edit')}
                </Button>
            ),
        },
    ], [t, openEdit, updateStatus]);

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    {t('cars.title')}
                </Typography.Title>

                <Space wrap>
                    <Button icon={<DownloadOutlined />} onClick={() => exportCarsToExcel(data)}>
                        {t('cars.exportExcel')}
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setCreateOpen(true);
                            createForm.setFieldsValue({
                                status: 'In Stock',
                                kaufdatum: dayjs(),
                                kfz_brief_nr: null,
                                ez: null,
                                farbe: null,
                            });
                        }}
                    >
                        {t('cars.addButton')}
                    </Button>
                </Space>
            </Space>

            <div style={{ height: 16 }} />

            {/* Поиск и фильтр */}
            <Space style={{ marginBottom: 16 }} wrap>
                <Input.Search
                    placeholder={t('cars.searchPlaceholder')}
                    allowClear
                    style={{ width: 280 }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Select<CarStatus | 'all'>
                    value={statusFilter}
                    style={{ width: 150 }}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'all', label: t('cars.allStatuses') },
                        { value: 'In Stock', label: 'In Stock' },
                        { value: 'Reserved', label: 'Reserved' },
                        { value: 'Sold', label: 'Sold' },
                    ]}
                />
            </Space>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
            />

            <Modal
                title={t('cars.addModal')}
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                onOk={() => createForm.submit()}
                okText={t('common.create')}
            >
                <CarForm form={createForm} onFinish={createCar} mode="create" />
            </Modal>

            <Modal
                title={t('cars.editModal', { nr: editing?.nr ?? '' })}
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                onOk={() => editForm.submit()}
                okText={t('common.save')}
            >
                <CarForm form={editForm} onFinish={saveEdit} mode="edit" />
            </Modal>
        </Card>
    );
}