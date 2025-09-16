import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import NotFound from "./pages/NotFound";
import CollectionPage from "./pages/CollectionPage";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CreateOrder from "./pages/CreateOrder";
import FAQ from "./pages/FAQ";
import TrackTrace from "./pages/TrackTrace";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import CustomerStorefront from "./components/store/CustomerStorefront";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import StoreManagerRoute from "./components/StoreManagerRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Admin routes - with auth and organization context */}
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <Admin />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/orders/new" element={
                <AdminProtectedRoute>
                  <CreateOrder />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/stores" element={<StoreManagerRoute />} />
              <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin store-specific routes */}
          <Route path="/store/:storeSlug" element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          } />
          
          {/* Default routes (with potential subdomain detection) */}
          <Route path="/" element={
            <StoreProvider>
              <CartProvider>
                <Index />
              </CartProvider>
            </StoreProvider>
          } />
          <Route path="/products" element={
            <StoreProvider>
              <CartProvider>
                <Products />
              </CartProvider>
            </StoreProvider>
          } />
          <Route path="/products/:slug" element={
            <StoreProvider>
              <CartProvider>
                <ProductDetail />
              </CartProvider>
            </StoreProvider>
          } />
          <Route path="/collections/:slug" element={
            <StoreProvider>
              <CartProvider>
                <CollectionPage />
              </CartProvider>
            </StoreProvider>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/checkout/success" element={
            <CartProvider>
              <CheckoutSuccess />
            </CartProvider>
          } />
          <Route path="/checkout" element={
            <CartProvider>
              <Checkout />
            </CartProvider>
          } />
          <Route path="/faq" element={
            <StoreProvider>
              <CartProvider>
                <FAQ />
              </CartProvider>
            </StoreProvider>
          } />
          <Route path="/track" element={
            <StoreProvider>
              <CartProvider>
                <TrackTrace />
              </CartProvider>
            </StoreProvider>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
