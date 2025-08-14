import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHome } from "@/components/admin/AdminHome";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminDiscountCodes } from "@/components/admin/AdminDiscountCodes";
import { AdminOnlineStore } from "@/components/admin/AdminOnlineStore";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminCollections } from "@/components/admin/AdminCollections";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export type AdminSection = 
  | "home" 
  | "orders" 
  | "products" 
  | "collections"
  | "customers" 
  | "discount-codes" 
  | "online-store" 
  | "settings";

const Admin = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("home");
  const { user, signOut } = useAuth();

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
      case "customers":
        return <AdminCustomers />;
      case "discount-codes":
        return <AdminDiscountCodes />;
      case "online-store":
        return <AdminOnlineStore />;
      case "settings":
        return <AdminSettings />;
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
              <h1 className="font-semibold">Admin Panel</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitloggen
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;