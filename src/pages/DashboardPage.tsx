import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Statistic, Typography, message } from 'antd';
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

type MonthPoint = { month: string; revenue: number };

function formatMoney(v: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

export function DashboardPage() {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [sold, setSold] = useState(0);
    const [inStock, setInStock] = useState(0);
    const [reserved, setReserved] = useState(0);
    const [chartData, setChartData] = useState<MonthPoint[]>([]);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);

            const [totalRes, soldRes, stockRes, reservedRes, contractsRes] = await Promise.all([
                supabase.from('cars').select('*', { count: 'exact', head: true }),
                supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'Sold'),
                supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'In Stock'),
                supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'Reserved'),
                supabase.from('contracts').select('contract_date, price').not('price', 'is', null),
            ]);

            if (!alive) return;

            const firstError = totalRes.error || soldRes.error || stockRes.error || reservedRes.error;
            if (firstError) {
                message.error(firstError.message);
                setLoading(false);
                return;
            }

            setTotal(totalRes.count ?? 0);
            setSold(soldRes.count ?? 0);
            setInStock(stockRes.count ?? 0);
            setReserved(reservedRes.count ?? 0);

            // Агрегация по месяцам
            if (!contractsRes.error && contractsRes.data) {
                const map = new Map<string, number>();
                for (const row of contractsRes.data as { contract_date: string | null; price: number | null }[]) {
                    if (!row.contract_date || row.price == null) continue;
                    const month = row.contract_date.slice(0, 7); // YYYY-MM
                    map.set(month, (map.get(month) ?? 0) + row.price);
                }
                const points: MonthPoint[] = Array.from(map.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-12) // последние 12 месяцев
                    .map(([month, revenue]) => ({ month, revenue }));
                setChartData(points);
            }

            setLoading(false);
        }

        void load();
        return () => { alive = false; };
    }, []);

    return (
        <>
            <Typography.Title level={3} style={{ marginTop: 0 }}>
                {t('dashboard.title')}
            </Typography.Title>

            {reserved > 0 && (
                <Alert
                    type="warning"
                    showIcon
                    description={t('dashboard.reservedAlert', { count: reserved })}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={6}>
                    <Card loading={loading}>
                        <Statistic title={t('dashboard.total')} value={total} prefix={<CarOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <Card loading={loading}>
                        <Statistic title={t('dashboard.inStock')} value={inStock} prefix={<ShopOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <Card loading={loading}>
                        <Statistic title={t('dashboard.sold')} value={sold} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <Card loading={loading}>
                        <Statistic
                            title={t('dashboard.reserved')}
                            value={reserved}
                            prefix={<ClockCircleOutlined />}
                            formatter={(v) => (
                                <span style={reserved > 0 ? { color: '#faad14' } : undefined}>{v}</span>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ height: 24 }} />

            <Card title={t('dashboard.monthlySales')} loading={loading}>
                {chartData.length === 0 && !loading ? (
                    <Typography.Text type="secondary">{t('dashboard.noChartData')}</Typography.Text>
                ) : (
                    <Column
                        data={chartData}
                        xField="month"
                        yField="revenue"
                        height={260}
                        axis={{
                            y: { title: t('dashboard.revenue') },
                            x: { title: false },
                        }}
                        tooltip={{
                            title: (d: MonthPoint) => d.month,
                            items: [
                                {
                                    field: 'revenue',
                                    name: t('dashboard.revenue'),
                                    valueFormatter: (v: number) => formatMoney(v),
                                },
                            ],
                        }}
                        style={{ fill: '#1677ff' }}
                    />
                )}
            </Card>
        </>
    );
}