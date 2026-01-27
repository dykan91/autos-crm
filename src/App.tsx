import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import CarsPage from './pages/CarsPage';
import ClientsPage from './pages/ClientsPage';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/cars" replace />} />
                <Route path="/cars" element={<CarsPage />} />
                <Route path="/clients" element={<ClientsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
