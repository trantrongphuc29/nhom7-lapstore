import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { StoreConfigProvider } from './context/StoreConfigContext';
import { CartProvider } from './context/CartContext';
import ToastStack from './components/cart/ToastStack';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <StoreConfigProvider>
            <CartProvider>
              <App />
              <ToastStack />
              <Toaster position="top-right" />
            </CartProvider>
          </StoreConfigProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
