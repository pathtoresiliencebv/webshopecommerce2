import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { OrganizationProvider } from './contexts/OrganizationContext'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <OrganizationProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </OrganizationProvider>
  </AuthProvider>
);
