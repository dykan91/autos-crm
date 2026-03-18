// src/pages/ContractsPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';
import { generateContractPdf } from '../pdf/contract';
import { CreateContractModal } from '../components/contracts/CreateContractModal';

export type ContractRowView = {
    id: string;
    nr: number;
    contract_date: string | null;
    price: number | null;
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
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [contracts, setContracts] = useState<ContractRowView[]>([]);
    const [search, setSearch] = useState('');

    const loadContracts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('contracts')
            .select(`
          id, nr, contract_date, price,
          tax_included, seller_statement_key, buyer_receives_flags, keys_count,
          export_destination, eu_with_tax, eu_tax_number, third_with_customs, third_customs_number,
          car:cars ( nr, fahrzeug, vin, kfz_brief_nr, ez, farbe ),
          client:clients ( nr, name, postal_code, city, address )
        `)
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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { void loadContracts(); }, [loadContracts]);

    const filtered = useMemo(() => {
        if (!search.trim()) return contracts;
        const q = search.toLowerCase();
        return contracts.filter(c =>
            c.car?.fahrzeug?.toLowerCase().includes(q) ||
            c.car?.vin?.toLowerCase().includes(q) ||
            c.client?.name?.toLowerCase().includes(q) ||
            String(c.nr).includes(q)
        );
    }, [contracts, search]);

    const columns: ColumnsType<ContractRowView> = useMemo(
        () => [
            { title: 'Nr', dataIndex: 'nr', width: 90 },
            {
                title: t('contracts.columns.date'),
                dataIndex: 'contract_date',
                width: 120,
                render: (v: string | null) => (v ? v : '—'),
            },
            {
                title: t('contracts.columns.amount'),
                dataIndex: 'price',
                width: 160,
                render: (v: number | null) => formatMoney(v ?? null),
            },
            {
                title: t('contracts.columns.car'),
                key: 'car',
                render: (_: unknown, row) => {
                    const c = row.car;
                    if (!c) return '—';
                    return (
                        <div>
                            <div><b>#{c.nr ?? ''}</b> — {c.fahrzeug ?? ''}</div>
                            <div style={{ opacity: 0.7, fontSize: 12 }}>VIN: {c.vin ?? ''}</div>
                        </div>
                    );
                },
            },
            {
                title: t('contracts.columns.client'),
                key: 'client',
                render: (_: unknown, row) => {
                    const cl = row.client;
                    if (!cl) return '—';
                    return (
                        <div>
                            <div><b>#{cl.nr ?? ''}</b> — {cl.name ?? ''}</div>
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
                width: 100,
                render: (_: unknown, row) => (
                    <Button icon={<FilePdfOutlined />} onClick={() => generateContractPdf(row)}>
                        PDF
                    </Button>
                ),
            },
        ],
        [t]
    );

    return (
        <Card>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    {t('contracts.title')}
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    {t('contracts.createButton')}
                </Button>
            </Space>

            <div style={{ height: 16 }} />

            <Input.Search
                placeholder={t('contracts.searchPlaceholder')}
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