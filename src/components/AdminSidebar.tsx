import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  Ticket, 
  Store, 
  Settings,
  Menu,
  ChevronDown
} from "lucide-react";
import { AdminSection } from "@/pages/Admin";
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
  { id: "customers" as AdminSection, label: "Customers", icon: Users },
  { id: "discount-codes" as AdminSection, label: "Discount Codes", icon: Ticket },
  { id: "online-store" as AdminSection, label: "Online Store", icon: Store },
  { id: "settings" as AdminSection, label: "Settings", icon: Settings },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar className={!open ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {open && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">FurniStore Management</p>
            </div>
          </div>
        )}
        {!open && (
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
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