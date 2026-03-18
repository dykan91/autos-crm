import { Layout, Menu, Button } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function AppLayout() {
    const nav = useNavigate();
    const loc = useLocation();
    const { t } = useTranslation();

    const [ready, setReady] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setHasSession(!!data.session);
            setReady(true);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setHasSession(!!session);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    if (!ready) return <div style={{ padding: 24 }}>{t('common.loading')}</div>;
    if (!hasSession) return <Navigate to="/login" replace />;

    const selectedKey =
        loc.pathname.startsWith('/app/contracts') ? 'contracts' :
            loc.pathname.startsWith('/app/clients') ? 'clients' :
                loc.pathname.startsWith('/app/cars') ? 'cars' :
                    'dashboard';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Sider breakpoint="lg" collapsedWidth="0">
                <div
                    style={{ color: 'white', padding: 16, fontWeight: 600 }}
                    onClick={() => nav('/')}>
                    Auto CRM
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={[
                        { key: 'dashboard', label: t('nav.dashboard'), onClick: () => nav('/app') },
                        { key: 'cars', label: t('nav.cars'), onClick: () => nav('/app/cars') },
                        { key: 'clients', label: t('nav.clients'), onClick: () => nav('/app/clients') },
                        { key: 'contracts', label: t('nav.contracts'), onClick: () => nav('/app/contracts') },
                    ]}
                />
            </Layout.Sider>

            <Layout>
                <Layout.Header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                    <LanguageSwitcher />
                    <Button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            nav('/login', { replace: true });
                        }}
                    >
                        {t('nav.logout')}
                    </Button>
                </Layout.Header>

                <Layout.Content style={{ padding: 16 }}>
                    <Outlet />
                </Layout.Content>
            </Layout>
        </Layout>
    );
}