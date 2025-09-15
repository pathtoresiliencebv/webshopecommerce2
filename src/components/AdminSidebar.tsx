import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  Building2,
  CreditCard,
  Headphones,
  Boxes,
  ArrowLeftRight,
  Gift
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

const mainMenuItems = [
  { id: "home" as AdminSection, label: "Home", icon: Home },
  { id: "orders" as AdminSection, label: "Orders", icon: ShoppingCart },
];

const productMenuItems = [
  { id: "products" as AdminSection, label: "All products", icon: Package },
  { id: "collections" as AdminSection, label: "Collections", icon: FolderOpen },
  { id: "inventory" as AdminSection, label: "Inventory", icon: Boxes },
  { id: "transfers" as AdminSection, label: "Transfers", icon: ArrowLeftRight },
  { id: "gift-cards" as AdminSection, label: "Gift cards", icon: Gift },
];

const customerMenuItems = [
  { id: "customers" as AdminSection, label: "Customers", icon: Users },
];

const marketingMenuItems = [
  { id: "discount-codes" as AdminSection, label: "Discount Codes", icon: Ticket },
  { id: "email-marketing" as AdminSection, label: "E-mail Marketing", icon: Mail },
];

const salesChannelItems = [
  { id: "theme" as AdminSection, label: "Thema", icon: Store },
  { id: "shopping-feeds" as AdminSection, label: "Shopping Feeds", icon: Rss },
];

const settingsItems = [
  { id: "store-settings" as AdminSection, label: "Settings", icon: Settings },
];

const multiStoreItems = [
  { id: "stores" as AdminSection, label: "Store Manager", icon: Building2 },
  { id: "subscription" as AdminSection, label: "Abonnement", icon: CreditCard },
  { id: "customer-service" as AdminSection, label: "Customer Service", icon: Headphones },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { open } = useSidebar();
  const { currentOrganization } = useOrganization();
  const [openGroups, setOpenGroups] = useState({
    products: true,
    customers: false,
    marketing: false,
    sales: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group as keyof typeof prev]
    }));
  };

  const isProductsActive = productMenuItems.some(item => item.id === activeSection);
  const isCustomersActive = customerMenuItems.some(item => item.id === activeSection);
  const isMarketingActive = marketingMenuItems.some(item => item.id === activeSection);
  const isSalesActive = salesChannelItems.some(item => item.id === activeSection);

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
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
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

        {/* Products Section */}
        <SidebarGroup>
          <Collapsible open={openGroups.products} onOpenChange={() => toggleGroup('products')}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`w-full justify-start font-medium ${isProductsActive ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Package className="mr-2 h-4 w-4" />
                {open && (
                  <>
                    <span>Products</span>
                    {openGroups.products ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {productMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onSectionChange(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full justify-start pl-8"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {open && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Customers Section */}
        <SidebarGroup>
          <Collapsible open={openGroups.customers} onOpenChange={() => toggleGroup('customers')}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`w-full justify-start font-medium ${isCustomersActive ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Users className="mr-2 h-4 w-4" />
                {open && (
                  <>
                    <span>Customers</span>
                    {openGroups.customers ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {customerMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onSectionChange(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full justify-start pl-8"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {open && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Marketing Section */}
        <SidebarGroup>
          <Collapsible open={openGroups.marketing} onOpenChange={() => toggleGroup('marketing')}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`w-full justify-start font-medium ${isMarketingActive ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Mail className="mr-2 h-4 w-4" />
                {open && (
                  <>
                    <span>Marketing</span>
                    {openGroups.marketing ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {marketingMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onSectionChange(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full justify-start pl-8"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {open && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Sales Channels Section */}
        <SidebarGroup>
          <Collapsible open={openGroups.sales} onOpenChange={() => toggleGroup('sales')}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`w-full justify-start font-medium ${isSalesActive ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Store className="mr-2 h-4 w-4" />
                {open && (
                  <>
                    <span>Sales channels</span>
                    {openGroups.sales ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {salesChannelItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onSectionChange(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full justify-start pl-8"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {open && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
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

        {/* Multi-Store */}
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