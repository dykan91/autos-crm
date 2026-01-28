import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import { CarsPage } from './pages/CarsPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContractsPage } from './pages/ContractsPage';
import PublicHomePage from './pages/PublicHomePage';

export default function App() {
    return (
        <Routes>
            {/* публичная */}
            <Route path="/" element={<PublicHomePage />} />

            {/* логин */}
            <Route path="/login" element={<LoginPage />} />

            {/* админка */}
            <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="cars" element={<CarsPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="contracts" element={<ContractsPage />} />
            </Route>

            {/* всё остальное */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
