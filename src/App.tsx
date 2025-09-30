import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
import { CartProvider } from "@/contexts/CartContext";
import { CartNotificationProvider } from "@/components/CartNotificationProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import NotFound from "./pages/NotFound";
import CollectionPage from "./pages/CollectionPage";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CreateOrder from "./pages/CreateOrder";
import FAQ from "./pages/FAQ";
import TrackTrace from "./pages/TrackTrace";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import StoreManagerRoute from "./components/StoreManagerRoute";
import { CreateStoreWizard } from "./components/admin/CreateStoreWizard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <TooltipProvider>
            <CartProvider>
              <CartNotificationProvider>
                <BrowserRouter>
                  <Toaster />
                  <Sonner />
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
                    <Route path="/admin/stores/new" element={
                      <AdminProtectedRoute>
                        <CreateStoreWizard />
                      </AdminProtectedRoute>
                    } />
                    <Route path="/dashboard" element={<Dashboard />} />
                
                    {/* Admin store-specific routes */}
                    <Route path="/admin/store/:storeSlug" element={
                      <AdminProtectedRoute>
                        <Admin />
                      </AdminProtectedRoute>
                    } />
                    
                    {/* Store-specific routes for main domain */}
                    <Route path="/store/:storeSlug" element={
                      <StoreProvider>
                        <Index />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/products" element={
                      <StoreProvider>
                        <Products />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/products/:slug" element={
                      <StoreProvider>
                        <ProductDetail />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/collections/:slug" element={
                      <StoreProvider>
                        <CollectionPage />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/auth" element={
                      <StoreProvider>
                        <Auth />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/checkout/success" element={
                      <StoreProvider>
                        <CheckoutSuccess />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/checkout" element={
                      <StoreProvider>
                        <Checkout />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/faq" element={
                      <StoreProvider>
                        <FAQ />
                      </StoreProvider>
                    } />
                    <Route path="/store/:storeSlug/track" element={
                      <StoreProvider>
                        <TrackTrace />
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
                    <Route path="/products/:slug" element={
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
                    <Route path="/auth" element={
                      <StoreProvider>
                        <Auth />
                      </StoreProvider>
                    } />
                    <Route path="/checkout/success" element={
                      <StoreProvider>
                        <CheckoutSuccess />
                      </StoreProvider>
                    } />
                    <Route path="/checkout" element={
                      <StoreProvider>
                        <Checkout />
                      </StoreProvider>
                    } />
                    <Route path="/faq" element={
                      <StoreProvider>
                        <FAQ />
                      </StoreProvider>
                    } />
                    <Route path="/track" element={
                      <StoreProvider>
                        <TrackTrace />
                      </StoreProvider>
                    } />
                    
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CartNotificationProvider>
            </CartProvider>
          </TooltipProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;