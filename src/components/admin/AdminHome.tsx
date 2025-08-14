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

const stats = [
  {
    title: "Total Revenue",
    value: "$54,239",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign
  },
  {
    title: "Orders",
    value: "1,429",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart
  },
  {
    title: "Products",
    value: "156",
    change: "+2.1%",
    trend: "up",
    icon: Package
  },
  {
    title: "Customers",
    value: "2,847",
    change: "+5.3%",
    trend: "up",
    icon: Users
  }
];

const recentOrders = [
  { id: "ORD-20241201-1234", customer: "John Smith", product: "Ergonomic Office Chair Pro", amount: "$299", status: "shipped" },
  { id: "ORD-20241201-1235", customer: "Sarah Johnson", product: "Standing Desk Premium", amount: "$599", status: "processing" },
  { id: "ORD-20241201-1236", customer: "Mike Wilson", product: "Storage Cabinet", amount: "$199", status: "delivered" },
  { id: "ORD-20241201-1237", customer: "Emily Davis", product: "Executive Leather Chair", amount: "$449", status: "pending" },
  { id: "ORD-20241201-1238", customer: "David Brown", product: "Minimalist Work Desk", amount: "$349", status: "shipped" }
];

const topProducts = [
  { name: "Ergonomic Office Chair Pro", sales: 156, revenue: "$46,644" },
  { name: "Standing Desk Premium", sales: 89, revenue: "$53,311" },
  { name: "Modern Storage Cabinet", sales: 134, revenue: "$26,666" },
  { name: "Executive Leather Chair", sales: 67, revenue: "$30,083" }
];

export function AdminHome() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <Button>
          <Eye className="mr-2 h-4 w-4" />
          View Store
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
            {recentOrders.map((order) => (
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
            ))}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Products</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{product.revenue}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>#{index + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}