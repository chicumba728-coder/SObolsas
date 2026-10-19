import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from './router.jsx';
import { SessionProvider } from './session.jsx';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </SessionProvider>
  </React.StrictMode>,
);
