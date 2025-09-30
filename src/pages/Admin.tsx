import { useState, useEffect, Suspense } from "react";
import { useParams } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHome } from "@/components/admin/AdminHome";
import { AdminDiscountCodes } from "@/components/admin/AdminDiscountCodes";
import { AdminTheme } from "@/components/admin/AdminTheme";
import { AdminStoreSettings } from "@/components/admin/AdminStoreSettings";
import { AdminThemeCustomize } from "@/components/admin/AdminThemeCustomize";
import { AdminThemes } from "@/components/admin/AdminThemes";
import { AdminTransfers } from "@/components/admin/AdminTransfers";
import { AdminGiftCards } from "@/components/admin/AdminGiftCards";
import { AdminShoppingFeeds } from "@/components/admin/AdminShoppingFeeds";
import { AdminPaymentMethods } from "@/components/admin/AdminPaymentMethods";

// Lazy-loaded components for better performance
import {
  LazyAdminProducts,
  LazyAdminOrders,
  LazyAdminCustomers,
  LazyAdminAnalytics,
  LazyAdminInventory,
  LazyAdminEmailMarketing,
  LazyAdminCollections,
  LazyAdminContent,
  LazyAdminPages,
  LazyAdminCustomerService,
} from "@/components/LazyAdminComponents";
import StoreManagementDashboard from "@/components/store/StoreManagementDashboard";
import SubscriptionManager from "@/components/billing/SubscriptionManager";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import OrganizationSwitcher from "@/components/OrganizationSwitcher";
import CreateStoreDialog from "@/components/CreateStoreDialog";
import ProductImportList from "@/pages/ProductImportList";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type AdminSection = 
  | "home" 
  | "orders"
  | "products"
  | "import-list"
  | "content"
  | "pages"
  | "analytics"
  | "products" 
  | "collections"
  | "inventory"
  | "transfers"
  | "gift-cards"
  | "customers" 
  | "discount-codes" 
  | "theme"
  | "theme-customize" 
  | "themes-manager"
  | "email-marketing"
  | "shopping-feeds"
  | "store-settings"
  | "stores"
  | "subscription"
  | "payment-methods"
  | "customer-service";

const Admin = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("home");
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const { user, signOut } = useAuth();
  const { currentOrganization, switchOrganization, loading: orgLoading } = useOrganization();
  const { storeSlug } = useParams();

  // Handle store-specific admin access
  useEffect(() => {
    if (storeSlug) {
      // Fetch store data and switch to it if the user has access
      const fetchStoreData = async () => {
        const { data: store, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', storeSlug)
          .single();
          
        if (store && !error) {
          setStoreData(store);
          // Switch to this organization if it's different from current
          if (currentOrganization?.id !== store.id) {
            switchOrganization(store.id);
          }
        }
      };
      
      fetchStoreData();
    }
  }, [storeSlug, currentOrganization?.id, switchOrganization]);

  const handleSignOut = async () => {
    await signOut();
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <AdminHome />;
      case "orders":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminOrders />
          </Suspense>
        );
      case "content":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminContent />
          </Suspense>
        );
      case "pages":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminPages />
          </Suspense>
        );
      case "analytics":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminAnalytics />
          </Suspense>
        );
      case "products":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminProducts />
          </Suspense>
        );
      case "collections":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminCollections />
          </Suspense>
        );
      case "inventory":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminInventory />
          </Suspense>
        );
      case "transfers":
        return <AdminTransfers />;
      case "gift-cards":
        return <AdminGiftCards />;
      case "customers":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminCustomers />
          </Suspense>
        );
      case "discount-codes":
        return <AdminDiscountCodes />;
      case "import-list":
        return <ProductImportList />;
      case "theme":
        return <AdminTheme onSectionChange={setActiveSection} />;
      case "theme-customize":
        return <AdminThemeCustomize onSectionChange={setActiveSection} />;
      case "themes-manager":
        return <AdminThemes />;
      case "email-marketing":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminEmailMarketing />
          </Suspense>
        );
      case "shopping-feeds":
        return <AdminShoppingFeeds />;
      case "store-settings":
        return <AdminStoreSettings />;
      case "stores":
        return <StoreManagementDashboard />;
      case "subscription":
        return <SubscriptionManager />;
      case "payment-methods":
        return <AdminPaymentMethods />;
      case "customer-service":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LazyAdminCustomerService />
          </Suspense>
        );
      default:
        return <AdminHome />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 overflow-auto">
          <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <h1 className="font-semibold">Admin Panel</h1>
                {currentOrganization && (
                  <OrganizationSwitcher onCreateNew={() => setShowCreateStore(true)} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCreateStore(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Store
                </Button>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitloggen
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {orgLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !currentOrganization ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <h2 className="text-xl font-semibold">Welkom bij het Admin Panel</h2>
                <p className="text-muted-foreground text-center">
                  Om te beginnen, maak je eerste store aan of selecteer een bestaande store.
                </p>
                <Button onClick={() => setShowCreateStore(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Maak je eerste store
                </Button>
              </div>
            ) : (
              renderContent()
            )}
          </div>
          
          <CreateStoreDialog 
            open={showCreateStore} 
            onOpenChange={setShowCreateStore} 
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;