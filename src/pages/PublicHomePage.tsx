import { useEffect, useState } from 'react';
import { Button, Card, Col, Layout, Row, Space, Typography, message, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import type { CarRow } from '../types/Car';

type PublicCar = Pick<CarRow, 'id' | 'nr' | 'fahrzeug' | 'verkaufspreis' | 'status'>;

function formatMoney(v: number | null | undefined) {
    if (v === null || v === undefined) return 'Цена по запросу';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

export default function PublicHomePage() {
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cars, setCars] = useState<PublicCar[]>([]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from('cars')
                .select('id,nr,fahrzeug,verkaufspreis,status')
                .eq('status', 'In Stock')
                .order('nr', { ascending: true });

            if (!mounted) return;

            if (error) {
                message.error(error.message);
                setCars([]);
            } else {
                setCars((data ?? []) as PublicCar[]);
            }

            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
                    Auto CRM — Авто в наличии
                </div>
                <div style={{ flex: 1 }} />
                <Button type="primary" onClick={() => nav('/login')}>
                    Вход
                </Button>
            </Layout.Header>

            <Layout.Content style={{ padding: 24 }}>
                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                    <div>
                        <Typography.Title level={2} style={{ marginBottom: 0 }}>
                            Машины в наличии
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Выберите авто — по вопросам покупки пишите/звоните
                        </Typography.Text>
                    </div>

                    {loading ? (
                        <Row gutter={[16, 16]}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Col key={i} xs={24} sm={12} md={8} lg={6}>
                                    <Card>
                                        <Skeleton active />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {cars.map((c) => (
                                <Col key={c.id} xs={24} sm={12} md={8} lg={6}>
                                    <Card
                                        hoverable
                                        cover={
                                            <div
                                                style={{
                                                    height: 160,
                                                    background: 'linear-gradient(135deg, #f0f0f0, #fafafa)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#999',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Фото скоро
                                            </div>
                                        }
                                    >
                                        <Typography.Text type="secondary">#{c.nr}</Typography.Text>
                                        <Typography.Title level={5} style={{ marginTop: 6 }}>
                                            {c.fahrzeug}
                                        </Typography.Title>
                                        <Typography.Title level={4} style={{ margin: 0 }}>
                                            {formatMoney(c.verkaufspreis)}
                                        </Typography.Title>
                                    </Card>
                                </Col>
                            ))}

                            {!cars.length && (
                                <Col span={24}>
                                    <Card>
                                        <Typography.Text type="secondary">
                                            Сейчас нет машин в наличии.
                                        </Typography.Text>
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    )}
                </Space>
            </Layout.Content>

            <Layout.Footer style={{ textAlign: 'center' }}>
                © {new Date().getFullYear()} Auto CRM
            </Layout.Footer>
        </Layout>
    );
}
