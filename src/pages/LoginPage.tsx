import { Card, Form, Input, Button, Typography, message } from 'antd';
import { signIn, getSession } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LoginPage() {
    const nav = useNavigate();

    useEffect(() => {
        if (getSession()) nav('/cars', { replace: true });
    }, [nav]);

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
            <Card style={{ width: 380 }}>
                <Typography.Title level={3} style={{ marginTop: 0 }}>
                    Вход
                </Typography.Title>

                <Form
                    layout="vertical"
                    onFinish={(values) => {
                        const { email, password } = values as { email: string; password: string };
                        const res = signIn(email, password);
                        if (!res.ok) return message.error(res.error);
                        nav('/cars', { replace: true });
                    }}
                >
                    <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item label="Пароль" name="password" rules={[{ required: true }]}>
                        <Input.Password />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block>
                        Войти
                    </Button>

                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        Пока тестовый пароль: <b>123456</b>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
