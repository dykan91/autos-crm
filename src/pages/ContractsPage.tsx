// src/pages/ContractsPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FilePdfOutlined, PlusOutlined } from '@ant-design/icons';

import { supabase } from '../lib/supabase';

// PDF generator (новая структура: src/pdf/contract/index.ts)
import { generateContractPdf } from '../pdf/contract';

// Modal (создание)
import { CreateContractModal } from '../components/contracts/CreateContractModal';

// Тип row для таблицы + PDF.
// Важно: поля должны совпадать с тем, что выбираем в select(...)
export type ContractRowView = {
    id: string;
    nr: number;
    contract_date: string | null;
    price: number | null;

    // optional: если ты уже добавил поля и хочешь дальше расширять PDF — оставляю здесь
    tax_included?: boolean | null;
    seller_statement_key?: string | null;
    buyer_receives_flags?: string[] | null;
    keys_count?: number | null;
    export_destination?: 'inland' | 'eu' | 'third' | null;
    eu_with_tax?: boolean | null;
    eu_tax_number?: string | null;
    third_with_customs?: boolean | null;
    third_customs_number?: string | null;

    car: {
        nr?: number;
        fahrzeug?: string;
        vin?: string;
        kfz_brief_nr?: string | null;
        ez?: string | null;
        farbe?: string | null;
    } | null;

    client: {
        nr?: number;
        name?: string;
        postal_code?: string;
        city?: string;
        address?: string;
    } | null;
};

function formatMoney(v: number | null | undefined) {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

export function ContractsPage() {
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [contracts, setContracts] = useState<ContractRowView[]>([]);

    const loadContracts = useCallback(async () => {
        setLoading(true);

        // ВАЖНО: select должен включать поля для PDF
        const { data, error } = await supabase
            .from('contracts')
            .select(
                `
          id, nr, contract_date, price,
          tax_included, seller_statement_key, buyer_receives_flags, keys_count,
          export_destination, eu_with_tax, eu_tax_number, third_with_customs, third_customs_number,
          car:cars ( nr, fahrzeug, vin, kfz_brief_nr, ez, farbe ),
          client:clients ( nr, name, postal_code, city, address )
        `
            )
            .order('nr', { ascending: false });

        if (error) {
            message.error(error.message);
            setContracts([]);
            setLoading(false);
            return;
        }

        setContracts((data ?? []) as unknown as ContractRowView[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadContracts();
    }, [loadContracts]);

    const columns: ColumnsType<ContractRowView> = useMemo(
        () => [
            { title: 'Nr', dataIndex: 'nr', width: 90 },
            {
                title: 'Дата',
                dataIndex: 'contract_date',
                width: 120,
                render: (v: string | null) => (v ? v : '—'),
            },
            {
                title: 'Сумма',
                dataIndex: 'price',
                width: 160,
                render: (v: number | null) => formatMoney(v ?? null),
            },
            {
                title: 'Машина',
                key: 'car',
                render: (_: unknown, row) => {
                    const c = row.car;
                    if (!c) return '—';
                    return (
                        <div>
                            <div>
                                <b>#{c.nr ?? ''}</b> — {c.fahrzeug ?? ''}
                            </div>
                            <div style={{ opacity: 0.7, fontSize: 12 }}>VIN: {c.vin ?? ''}</div>
                        </div>
                    );
                },
            },
            {
                title: 'Клиент',
                key: 'client',
                render: (_: unknown, row) => {
                    const cl = row.client;
                    if (!cl) return '—';
                    return (
                        <div>
                            <div>
                                <b>#{cl.nr ?? ''}</b> — {cl.name ?? ''}
                            </div>
                            <div style={{ opacity: 0.7, fontSize: 12 }}>
                                {(cl.postal_code ?? '').toString()} {cl.city ?? ''}, {cl.address ?? ''}
                            </div>
                        </div>
                    );
                },
            },
            {
                title: 'PDF',
                key: 'pdf',
                width: 120,
                render: (_: unknown, row) => (
                    <Button
                        icon={<FilePdfOutlined />}
                        onClick={() => {
                            // pdf generator ожидает row с car/client
                            generateContractPdf(row);
                        }}
                    >
                        PDF
                    </Button>
                ),
            },
        ],
        []
    );

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Договоры
                </Typography.Title>

                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
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
                scroll={{ x: 1000 }}
            />

            <CreateContractModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={loadContracts}
            />
        </Card>
    );
}
