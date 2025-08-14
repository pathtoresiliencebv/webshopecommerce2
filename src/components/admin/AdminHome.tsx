import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export function AdminHome() {
  // Fetch analytics data
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [ordersResult, productsResult, profilesResult] = await Promise.all([
        supabase.from('orders').select('total_amount, created_at'),
        supabase.from('products').select('id'),
        supabase.from('profiles').select('id')
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const orderCount = ordersResult.data?.length || 0;
      const productCount = productsResult.data?.length || 0;
      const customerCount = profilesResult.data?.length || 0;

      return [
        {
          title: "Total Revenue",
          value: `€${totalRevenue.toFixed(2)}`,
          change: "+0.0%",
          trend: "up" as const,
          icon: DollarSign
        },
        {
          title: "Orders",
          value: orderCount.toString(),
          change: "+0.0%", 
          trend: "up" as const,
          icon: ShoppingCart
        },
        {
          title: "Products",
          value: productCount.toString(),
          change: "+0.0%",
          trend: "up" as const,
          icon: Package
        },
        {
          title: "Customers",
          value: customerCount.toString(),
          change: "+0.0%",
          trend: "up" as const,
          icon: Users
        }
      ];
    }
  });

  // Fetch recent orders
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          shipping_first_name,
          shipping_last_name,
          order_items (
            product_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data?.map(order => ({
        id: order.order_number,
        customer: `${order.shipping_first_name} ${order.shipping_last_name}`,
        product: order.order_items?.[0]?.product_name || 'Multiple items',
        amount: `€${Number(order.total_amount).toFixed(2)}`,
        status: order.status
      })) || [];
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <Link to="/">
          <Button>
            <Eye className="mr-2 h-4 w-4" />
            View Store
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-sm mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.product}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{order.amount}</p>
                    <Badge 
                      variant={
                        order.status === "delivered" ? "default" :
                        order.status === "shipped" ? "secondary" :
                        order.status === "processing" ? "outline" : "destructive"
                      }
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Status</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">Connected and operational</p>
              </div>
              <div className="text-right">
                <Badge variant="default" className="text-xs">
                  Online
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-muted-foreground">Image uploads working</p>
              </div>
              <div className="text-right">
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}