import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import React from 'react';
import {ConfigProvider, theme} from 'antd';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ConfigProvider
                theme={{
                    algorithm: theme.defaultAlgorithm,
                    token: {
                        colorPrimary: '#1677ff',
                        borderRadius: 12,
                        fontSize: 14,
                    },
                    components: {
                        Card: { paddingLG: 24 },
                        Button: { controlHeight: 44 },
                        Input: { controlHeight: 44 },
                    },
                }}
            >
                <App />
            </ConfigProvider>
        </BrowserRouter>
    </React.StrictMode>
)
