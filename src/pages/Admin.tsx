import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHome } from "@/components/admin/AdminHome";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminDiscountCodes } from "@/components/admin/AdminDiscountCodes";
import { AdminOnlineStore } from "@/components/admin/AdminOnlineStore";
import { AdminEmailMarketing } from "@/components/admin/AdminEmailMarketing";
import { AdminShoppingFeeds } from "@/components/admin/AdminShoppingFeeds";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminCollections } from "@/components/admin/AdminCollections";
import { AdminCustomerService } from "@/components/admin/AdminCustomerService";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminTransfers } from "@/components/admin/AdminTransfers";
import { AdminGiftCards } from "@/components/admin/AdminGiftCards";
import StoreManagementDashboard from "@/components/store/StoreManagementDashboard";
import SubscriptionManager from "@/components/billing/SubscriptionManager";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import OrganizationSwitcher from "@/components/OrganizationSwitcher";
import CreateStoreDialog from "@/components/CreateStoreDialog";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";

export type AdminSection = 
  | "home" 
  | "orders" 
  | "products" 
  | "collections"
  | "inventory"
  | "transfers"
  | "gift-cards"
  | "customers" 
  | "discount-codes" 
  | "online-store" 
  | "email-marketing"
  | "shopping-feeds"
  | "settings"
  | "stores"
  | "subscription"
  | "customer-service";

const Admin = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("home");
  const [showCreateStore, setShowCreateStore] = useState(false);
  const { user, signOut } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();

  const handleSignOut = async () => {
    await signOut();
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <AdminHome />;
      case "orders":
        return <AdminOrders />;
      case "products":
        return <AdminProducts />;
      case "collections":
        return <AdminCollections />;
      case "inventory":
        return <AdminInventory />;
      case "transfers":
        return <AdminTransfers />;
      case "gift-cards":
        return <AdminGiftCards />;
      case "customers":
        return <AdminCustomers />;
      case "discount-codes":
        return <AdminDiscountCodes />;
      case "online-store":
        return <AdminOnlineStore />;
      case "email-marketing":
        return <AdminEmailMarketing />;
      case "shopping-feeds":
        return <AdminShoppingFeeds />;
      case "settings":
        return <AdminSettings />;
      case "stores":
        return <StoreManagementDashboard />;
      case "subscription":
        return <SubscriptionManager />;
      case "customer-service":
        return <AdminCustomerService />;
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