import { Card, Form, Input, Button, Typography, message } from 'antd';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

type FormValues = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const nav = useNavigate();
    const [form] = Form.useForm<FormValues>();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) nav('/cars', { replace: true });
        });
    }, [nav]);

    async function login(values: FormValues) {
        const { email, password } = values;

        const res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) return message.error(res.error.message);

        nav('/cars', { replace: true });
    }

    async function register() {
        const values = await form.validateFields();
        const { email, password } = values;

        const res = await supabase.auth.signUp({ email, password });
        if (res.error) return message.error(res.error.message);

        message.success('Аккаунт создан. Теперь войди.');
    }

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
            <Card style={{ width: 380 }}>
                <Typography.Title level={3} style={{ marginTop: 0 }}>
                    Вход
                </Typography.Title>

                <Form<FormValues>
                    form={form}
                    layout="vertical"
                    onFinish={login}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input autoComplete="email" />
                    </Form.Item>

                    <Form.Item
                        label="Пароль"
                        name="password"
                        rules={[{ required: true, min: 6 }]}
                    >
                        <Input.Password autoComplete="current-password" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block>
                        Войти
                    </Button>

                    <Button
                        style={{ marginTop: 8 }}
                        block
                        onClick={register}
                    >
                        Регистрация
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
