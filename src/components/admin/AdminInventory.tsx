import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization) {
      fetchInventory();
    }
  }, [currentOrganization]);

  const fetchInventory = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(image_url, is_primary),
          categories(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      setProducts(products || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock_quantity <= 5);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of stock", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Low stock", variant: "secondary" as const };
    return { label: "In stock", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">Track and manage your product inventory</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalInventoryValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Inventory Overview</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No inventory found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product.stock_quantity);
                    const primaryImage = product.product_images?.find(img => img.is_primary);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {primaryImage ? (
                              <img 
                                src={primaryImage.image_url} 
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.categories?.name || 'Uncategorized'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>{product.categories?.name || 'Uncategorized'}</TableCell>
                        <TableCell>€{product.price}</TableCell>
                        <TableCell className="font-medium">
                          {product.stock_quantity > 0 ? product.stock_quantity : 'Inventory not tracked'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>€{(product.price * product.stock_quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}