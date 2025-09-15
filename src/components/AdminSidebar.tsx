import { 
  Home, 
  ShoppingCart, 
  Package, 
  FolderOpen,
  Users, 
  Ticket, 
  Store, 
  Mail,
  Rss,
  Settings,
  Menu,
  ChevronDown,
  Building2,
  CreditCard,
  Headphones
} from "lucide-react";
import { AdminSection } from "@/pages/Admin";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

const menuItems = [
  { id: "home" as AdminSection, label: "Home", icon: Home },
  { id: "orders" as AdminSection, label: "Orders", icon: ShoppingCart },
  { id: "products" as AdminSection, label: "Products", icon: Package },
  { id: "collections" as AdminSection, label: "Collections", icon: FolderOpen },
  { id: "customers" as AdminSection, label: "Customers", icon: Users },
  { id: "discount-codes" as AdminSection, label: "Discount Codes", icon: Ticket },
  { id: "online-store" as AdminSection, label: "Online Store", icon: Store },
  { id: "email-marketing" as AdminSection, label: "E-mail Marketing", icon: Mail },
  { id: "shopping-feeds" as AdminSection, label: "Shopping Feeds", icon: Rss },
  { id: "settings" as AdminSection, label: "Settings", icon: Settings },
];

const multiStoreItems = [
  { id: "stores" as AdminSection, label: "Store Manager", icon: Building2 },
  { id: "subscription" as AdminSection, label: "Abonnement", icon: CreditCard },
  { id: "customer-service" as AdminSection, label: "Customer Service", icon: Headphones },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { open } = useSidebar();
  const { currentOrganization } = useOrganization();

  return (
    <Sidebar className={!open ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {open && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {currentOrganization?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {currentOrganization?.name || 'Store Admin'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {currentOrganization?.description || 'Store Management'}
              </p>
            </div>
          </div>
        )}
        {!open && (
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {currentOrganization?.name?.charAt(0) || 'S'}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Store Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {open && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Multi-Store</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {multiStoreItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {open && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {open && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">Admin User</p>
              <p className="text-xs truncate">admin@furnistore.com</p>
            </div>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      )}

      <SidebarTrigger className="absolute -right-3 top-4 z-10" />
    </Sidebar>
  );
}