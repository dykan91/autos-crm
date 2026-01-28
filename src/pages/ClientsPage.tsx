import { useCallback, useEffect, useState } from 'react';
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
    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="name" label="Имя" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="city" label="Город" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="postal_code" label="Индекс" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="address" label="Адрес" rules={[{ required: true }]}>
                <Input placeholder="Улица, дом" />
            </Form.Item>
        </Form>
    );
}

export function ClientsPage() {
    const [data, setData] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<ClientRow | null>(null);

    const [createForm] = Form.useForm<ClientFormValues>();
    const [editForm] = Form.useForm<ClientFormValues>();

    const load = useCallback(async () => {
        setLoading(true);

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

    useEffect(() => {
        let cancelled = false;

        (async () => {
            // ✅ чтобы ESLint не ругался на setState-in-effect каскадом
            // мы делаем async IIFE + guard
            setLoading(true);

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('nr', { ascending: true });

            if (cancelled) return;

            if (error) {
                message.error(error.message);
                setData([]);
            } else {
                setData((data ?? []) as ClientRow[]);
            }

            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

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

    const columns: ColumnsType<ClientRow> = [
        { title: 'Nr', dataIndex: 'nr', width: 80 },
        { title: 'Имя', dataIndex: 'name' },
        { title: 'Город', dataIndex: 'city', width: 160 },
        { title: 'Индекс', dataIndex: 'postal_code', width: 110 },
        { title: 'Адрес', dataIndex: 'address' },
        {
            title: 'Действия',
            key: 'action',
            width: 120,
            render: (_: unknown, row) => (
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)}>
                    Edit
                </Button>
            ),
        },
    ];

    async function createClient(values: ClientFormValues) {
        const { error } = await supabase.from('clients').insert(values);
        if (error) return message.error(error.message);

        message.success('Клиент добавлен');
        setCreateOpen(false);
        createForm.resetFields();
        await load();
    }

    async function saveEdit(values: ClientFormValues) {
        if (!editing) return;

        const { error } = await supabase
            .from('clients')
            .update(values)
            .eq('id', editing.id);

        if (error) return message.error(error.message);

        message.success('Сохранено');
        setEditOpen(false);
        setEditing(null);
        await load();
    }

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Клиенты
                </Typography.Title>

                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    Добавить
                </Button>
            </Space>

            <div style={{ height: 16 }} />

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
            />

            <Modal
                title="Добавить клиента"
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                onOk={() => createForm.submit()}
                okText="Создать"
            >
                <ClientForm form={createForm} onFinish={createClient} />
            </Modal>

            <Modal
                title={`Редактировать клиента ${editing?.nr ?? ''}`}
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                onOk={() => editForm.submit()}
                okText="Сохранить"
            >
                <ClientForm form={editForm} onFinish={saveEdit} />
            </Modal>
        </Card>
    );
}
