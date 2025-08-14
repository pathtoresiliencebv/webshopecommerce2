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
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;