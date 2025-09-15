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
  Trash2,
  BarChart3
} from "lucide-react";

const stats = [
  {
    title: "Totale Verkopen",
    value: "€0",
    change: "-",
    icon: Euro,
    trend: "neutral"
  },
  {
    title: "Bestellingen",
    value: "0",
    change: "-",
    icon: ShoppingCart,
    trend: "neutral"
  },
  {
    title: "Producten",
    value: "0",
    change: "-",
    icon: Package,
    trend: "neutral"
  },
  {
    title: "Klanten",
    value: "0",
    change: "-",
    icon: Users,
    trend: "neutral"
  },
];

const recentOrders: any[] = [];
const products: any[] = [];

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
                {recentOrders.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nog geen bestellingen</h3>
                    <p>Je eerste bestellingen verschijnen hier zodra klanten aankopen doen.</p>
                  </div>
                ) : (
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
                )}
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
                {products.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nog geen producten</h3>
                    <p className="mb-4">Voeg producten toe aan je catalogus om te beginnen met verkopen.</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Eerste Product Toevoegen
                    </Button>
                  </div>
                ) : (
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
                )}
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
                  <div className="h-64 bg-accent/50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Nog geen verkoop data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Top Producten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-accent/50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                      <p>Nog geen product data</p>
                    </div>
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