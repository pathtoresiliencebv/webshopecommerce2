import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { ProductScraper } from "./ProductScraper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showScraper, setShowScraper] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts = data?.map(product => ({
        ...product,
        tags: [], // Will be populated later when relations are set up
        collections: [], // Will be populated later when relations are set up
        image: null // Will be populated later when product_images are set up
      })) || [];

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleScrapeProduct = () => {
    setShowScraper(true);
  };

  const handleProductScraped = (productData: any) => {
    setEditingProduct(productData);
    setShowForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct?.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: productData.name,
            sku: productData.sku,
            description: productData.description,
            short_description: productData.shortDescription,
            price: parseFloat(productData.price) || 0,
            original_price: parseFloat(productData.originalPrice) || null,
            stock_quantity: parseInt(productData.stockQuantity) || 0,
            is_active: productData.isActive,
            is_featured: productData.isFeatured,
            is_new: productData.isNew,
            is_sale: productData.isSale,
            meta_title: productData.metaTitle,
            meta_description: productData.metaDescription,
            weight: parseFloat(productData.weight) || null,
            dimensions_length: parseFloat(productData.dimensions.length) || null,
            dimensions_width: parseFloat(productData.dimensions.width) || null,
            dimensions_height: parseFloat(productData.dimensions.height) || null,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            sku: productData.sku,
            description: productData.description,
            short_description: productData.shortDescription,
            price: parseFloat(productData.price) || 0,
            original_price: parseFloat(productData.originalPrice) || null,
            stock_quantity: parseInt(productData.stockQuantity) || 0,
            is_active: productData.isActive,
            is_featured: productData.isFeatured,
            is_new: productData.isNew,
            is_sale: productData.isSale,
            meta_title: productData.metaTitle,
            meta_description: productData.metaDescription,
            weight: parseFloat(productData.weight) || null,
            dimensions_length: parseFloat(productData.dimensions.length) || null,
            dimensions_width: parseFloat(productData.dimensions.width) || null,
            dimensions_height: parseFloat(productData.dimensions.height) || null,
            slug: productData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
          })
          .select()
          .single();

        if (error) throw error;
        toast({ title: "Success", description: "Product created successfully" });
      }
      
      await fetchProducts();
      setShowForm(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Product deleted successfully" });
      await fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={handleSaveProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleScrapeProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Scrape Product
          </Button>
          <Button variant="outline" onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Product List</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No products found. Try scraping or adding products manually.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs">No img</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>€{product.price}</span>
                          {product.original_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              €{product.original_price}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.stock_quantity || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.is_active && <Badge variant="default">Active</Badge>}
                          {product.is_featured && <Badge variant="secondary">Featured</Badge>}
                          {product.is_new && <Badge variant="outline">New</Badge>}
                          {product.is_sale && <Badge variant="destructive">Sale</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductScraper
        open={showScraper}
        onClose={() => setShowScraper(false)}
        onProductScraped={handleProductScraped}
      />
    </div>
  );
}