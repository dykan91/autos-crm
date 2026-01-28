import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, message } from 'antd';
import { CarOutlined, CheckCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

export function DashboardPage() {
    const [loading, setLoading] = useState(true);

    const [total, setTotal] = useState(0);
    const [sold, setSold] = useState(0);
    const [inStock, setInStock] = useState(0);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);

            const [totalRes, soldRes, stockRes] = await Promise.all([
                supabase.from('cars').select('*', { count: 'exact', head: true }),
                supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'Sold'),
                supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'In Stock'),
            ]);

            if (!alive) return;

            const firstError = totalRes.error || soldRes.error || stockRes.error;
            if (firstError) {
                console.error(firstError);
                message.error(firstError.message);
                setLoading(false);
                return;
            }

            setTotal(totalRes.count ?? 0);
            setSold(soldRes.count ?? 0);
            setInStock(stockRes.count ?? 0);

            setLoading(false);
        }

        void load();
        return () => {
            alive = false;
        };
    }, []);

    return (
        <>
            <Typography.Title level={3} style={{ marginTop: 0 }}>
                Dashboard
            </Typography.Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Card loading={loading}>
                        <Statistic title="Всего машин" value={total} prefix={<CarOutlined />} />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                    <Card loading={loading}>
                        <Statistic title="В наличии" value={inStock} prefix={<ShopOutlined />} />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                    <Card loading={loading}>
                        <Statistic title="Продано" value={sold} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
            </Row>
        </>
    );
}
