import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Form,
    Input,
    Modal,
    Space,
    Table,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';
import type { ClientRow } from '../types/Client';

type ClientFormValues = {
    name: string;
    city: string;
    postal_code: string;
    address: string;
};

function ClientForm({
    form,
    onFinish,
}: {
    form: FormInstance<ClientFormValues>;
    onFinish: (v: ClientFormValues) => void;
}) {
    const { t } = useTranslation();

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="name" label={t('clients.fields.name')} rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="city" label={t('clients.fields.city')} rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="postal_code" label={t('clients.fields.postalCode')} rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="address" label={t('clients.fields.address')} rules={[{ required: true }]}>
                <Input placeholder={t('clients.placeholders.address')} />
            </Form.Item>
        </Form>
    );
}

export function ClientsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<ClientRow | null>(null);

    const [createForm] = Form.useForm<ClientFormValues>();
    const [editForm] = Form.useForm<ClientFormValues>();

    const load = useCallback(async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('nr', { ascending: true });
        if (error) {
            message.error(error.message);
            setData([]);
        } else {
            setData((data ?? []) as ClientRow[]);
        }
        setLoading(false);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { void load(); }, [load]);

    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.city?.toLowerCase().includes(q) ||
            r.postal_code?.toLowerCase().includes(q)
        );
    }, [data, search]);

    const openEdit = useCallback(
        (row: ClientRow) => {
            setEditing(row);
            setEditOpen(true);
            editForm.setFieldsValue({
                name: row.name,
                city: row.city,
                postal_code: row.postal_code,
                address: row.address,
            });
        },
        [editForm]
    );

    const columns: ColumnsType<ClientRow> = useMemo(() => [
        { title: 'Nr', dataIndex: 'nr', width: 80 },
        { title: t('clients.fields.name'), dataIndex: 'name' },
        { title: t('clients.fields.city'), dataIndex: 'city', width: 160 },
        { title: t('clients.fields.postalCode'), dataIndex: 'postal_code', width: 110 },
        { title: t('clients.fields.address'), dataIndex: 'address' },
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
    ], [t, openEdit]);

    async function createClient(values: ClientFormValues) {
        const { error } = await supabase.from('clients').insert(values);
        if (error) return message.error(error.message);
        message.success(t('clients.added'));
        setCreateOpen(false);
        createForm.resetFields();
        setLoading(true);
        await load();
    }

    async function saveEdit(values: ClientFormValues) {
        if (!editing) return;
        const { error } = await supabase.from('clients').update(values).eq('id', editing.id);
        if (error) return message.error(error.message);
        message.success(t('common.saved'));
        setEditOpen(false);
        setEditing(null);
        setLoading(true);
        await load();
    }

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    {t('clients.title')}
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    {t('clients.addButton')}
                </Button>
            </Space>

            <div style={{ height: 16 }} />

            <Input.Search
                placeholder={t('clients.searchPlaceholder')}
                allowClear
                style={{ width: 280, marginBottom: 16 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
            />

            <Modal
                title={t('clients.addModal')}
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                onOk={() => createForm.submit()}
                okText={t('common.create')}
            >
                <ClientForm form={createForm} onFinish={createClient} />
            </Modal>

            <Modal
                title={t('clients.editModal', { nr: editing?.nr ?? '' })}
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                onOk={() => editForm.submit()}
                okText={t('common.save')}
            >
                <ClientForm form={editForm} onFinish={saveEdit} />
            </Modal>
        </Card>
    );
}