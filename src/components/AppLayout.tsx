import { Layout, Menu, Button } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AppLayout() {
    const nav = useNavigate();
    const loc = useLocation();

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

    if (!ready) return <div style={{ padding: 24 }}>Loading…</div>;
    if (!hasSession) return <Navigate to="/login" replace />;

    const selectedKey = loc.pathname.startsWith('/clients') ? 'clients' : 'cars';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Sider breakpoint="lg" collapsedWidth="0">
                <div style={{ color: 'white', padding: 16, fontWeight: 600 }}>Auto CRM</div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={[
                        { key: 'cars', label: 'Машины', onClick: () => nav('/cars') },
                        { key: 'clients', label: 'Клиенты', onClick: () => nav('/clients') },
                    ]}
                />
            </Layout.Sider>

            <Layout>
                <Layout.Header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            nav('/login', { replace: true });
                        }}
                    >
                        Выйти
                    </Button>
                </Layout.Header>

                <Layout.Content style={{ padding: 16 }}>
                    <Outlet />
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
