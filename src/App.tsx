import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
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
          
          {/* Store-specific routes */}
          <Route path="/store/:storeSlug" element={
            <StoreProvider>
              <CustomerStorefront />
            </StoreProvider>
          } />
          <Route path="/store/:storeSlug/products" element={
            <StoreProvider>
              <Products />
            </StoreProvider>
          } />
          <Route path="/store/:storeSlug/products/:id" element={
            <StoreProvider>
              <ProductDetail />
            </StoreProvider>
          } />
          <Route path="/store/:storeSlug/collections/:slug" element={
            <StoreProvider>
              <CollectionPage />
            </StoreProvider>
          } />
          
          {/* Default routes (with potential subdomain detection) */}
          <Route path="/" element={
            <StoreProvider>
              <Index />
            </StoreProvider>
          } />
          <Route path="/products" element={
            <StoreProvider>
              <Products />
            </StoreProvider>
          } />
          <Route path="/products/:id" element={
            <StoreProvider>
              <ProductDetail />
            </StoreProvider>
          } />
          <Route path="/collections/:slug" element={
            <StoreProvider>
              <CollectionPage />
            </StoreProvider>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
          
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
