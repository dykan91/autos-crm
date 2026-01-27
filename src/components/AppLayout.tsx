import { Layout, Menu, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession, signOut } from '../lib/auth';

export default function AppLayout() {
    const nav = useNavigate();
    const loc = useLocation();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const s = getSession();
        if (!s) nav('/login', { replace: true });
        setReady(true);
    }, [nav]);

    if (!ready) return null;

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
                        onClick={() => {
                            signOut();
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
