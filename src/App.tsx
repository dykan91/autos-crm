import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from './components/AppLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const PublicHomePage = lazy(() => import('./pages/PublicHomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CarsPage = lazy(() => import('./pages/CarsPage').then(m => ({ default: m.CarsPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ContractsPage = lazy(() => import('./pages/ContractsPage').then(m => ({ default: m.ContractsPage })));

const Fallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Spin size="large" />
    </div>
);

export default function App() {
    return (
        <Suspense fallback={<Fallback />}>
            <Routes>
                <Route path="/" element={<PublicHomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/app" element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="cars" element={<CarsPage />} />
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="contracts" element={<ContractsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}