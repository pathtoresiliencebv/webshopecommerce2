import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Users, 
  TrendingUp, 
  Euro,
  ShoppingCart,
  Eye,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

const stats = [
  {
    title: "Totale Verkopen",
    value: "€12,345",
    change: "+12%",
    icon: Euro,
    trend: "up"
  },
  {
    title: "Bestellingen",
    value: "143",
    change: "+8%",
    icon: ShoppingCart,
    trend: "up"
  },
  {
    title: "Producten",
    value: "64",
    change: "+3",
    icon: Package,
    trend: "up"
  },
  {
    title: "Klanten",
    value: "1,234",
    change: "+24%",
    icon: Users,
    trend: "up"
  },
];

const recentOrders = [
  { id: "ORD-001", customer: "Jan van Dijk", product: "Ergonomische Stoel", amount: "€299", status: "Verzonden" },
  { id: "ORD-002", customer: "Maria Jansen", product: "Sta-Bureau", amount: "€599", status: "Verwerkt" },
  { id: "ORD-003", customer: "Piet de Vries", product: "Opbergkast", amount: "€199", status: "Nieuw" },
  { id: "ORD-004", customer: "Anna Bakker", product: "Executive Stoel", amount: "€449", status: "Verzonden" },
];

const products = [
  { id: "1", name: "Ergonomische Kantoorstoel Pro", price: "€299", stock: 24, status: "Actief" },
  { id: "2", name: "Verstelbare Sta-Bureau Premium", price: "€599", stock: 12, status: "Actief" },
  { id: "3", name: "Moderne Opbergkast wit", price: "€199", stock: 8, status: "Laag" },
  { id: "4", name: "Executive Lederen Stoel", price: "€449", stock: 0, status: "Uitverkocht" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welkom terug! Hier is een overzicht van je winkel.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change} vs vorige maand
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-400">
            <TabsTrigger value="orders">Bestellingen</TabsTrigger>
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Recente Bestellingen</CardTitle>
                <CardDescription>
                  Overzicht van de laatste bestellingen in je winkel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-foreground">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.customer}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.product}</p>
                          <p className="text-sm text-muted-foreground">{order.amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            order.status === "Verzonden" ? "default" :
                            order.status === "Verwerkt" ? "secondary" : 
                            "outline"
                          }
                        >
                          {order.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card className="border-0 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Beheer</CardTitle>
                  <CardDescription>
                    Beheer je productcatalogus
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Product
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-accent rounded-lg"></div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Voorraad: {product.stock}</p>
                          <Badge 
                            variant={
                              product.status === "Actief" ? "default" :
                              product.status === "Laag" ? "secondary" : 
                              "destructive"
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Verkoop Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-accent/50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Grafiek komt hier</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Top Producten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-accent/50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Grafiek komt hier</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}