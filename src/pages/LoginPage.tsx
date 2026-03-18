import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

type FormValues = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const nav = useNavigate();
    const [form] = Form.useForm<FormValues>();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) nav('/app', { replace: true });
        });
    }, [nav]);

    async function login(values: FormValues) {
        const res = await supabase.auth.signInWithPassword(values);
        if (res.error) return message.error(res.error.message);
        nav('/app', { replace: true });
    }

    async function register() {
        const values = await form.validateFields();
        const { email, password } = values;
        const res = await supabase.auth.signUp({ email, password });
        if (res.error) return message.error(res.error.message);
        message.success(t('login.registered'));
    }

    const current = i18n.language as 'ru' | 'de';

    return (
        <div
            style={{
                minHeight: '100vh',
                padding: 24,
                background: 'linear-gradient(180deg, #f5f7ff 0%, #ffffff 60%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <div style={{ width: 420, maxWidth: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        Auto CRM
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        {t('login.subtitle')}
                    </Typography.Text>
                    <div style={{ marginTop: 12 }}>
                        <Space size={4}>
                            <Button size="small" type={current === 'ru' ? 'primary' : 'default'} onClick={() => setLanguage('ru')}>RU</Button>
                            <Button size="small" type={current === 'de' ? 'primary' : 'default'} onClick={() => setLanguage('de')}>DE</Button>
                        </Space>
                    </div>
                </div>

                <Card style={{ width: '100%' }}>
                    <Typography.Title level={3} style={{ marginTop: 0 }}>
                        {t('login.title')}
                    </Typography.Title>

                    <Form<FormValues>
                        form={form}
                        layout="vertical"
                        onFinish={login}
                    >
                        <Form.Item
                            label={t('login.email')}
                            name="email"
                            rules={[{ required: true, type: 'email' }]}
                        >
                            <Input autoComplete="email" />
                        </Form.Item>

                        <Form.Item
                            label={t('login.password')}
                            name="password"
                            rules={[{ required: true, min: 6 }]}
                        >
                            <Input.Password autoComplete="current-password" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block>
                            {t('login.submit')}
                        </Button>

                        <Button style={{ marginTop: 8 }} block onClick={register}>
                            {t('login.register')}
                        </Button>
                    </Form>
                </Card>
                <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
                    © {new Date().getFullYear()} Auto CRM
                </Typography.Text>
            </div>
        </div>
    );
}