import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Tag, Folder, ArrowLeft, MoreHorizontal } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { ProductVariants } from "./ProductVariants";
import { ProductOrganization } from "./ProductOrganization";

interface ProductFormProps {
  product?: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const { currentOrganization } = useOrganization();
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    stockQuantity: product?.stockQuantity || "",
    category: product?.category || "",
    vendor: product?.vendor || "",
    product_type: product?.product_type || "",
    tags: product?.tags || [],
    collections: product?.collections || [],
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? false,
    isSale: product?.isSale ?? false,
    metaTitle: product?.metaTitle || "",
    metaDescription: product?.metaDescription || "",
    imageUrl: product?.imageUrl || "",
    weight: product?.weight || "",
    dimensions: {
      length: product?.dimensions?.length || "",
      width: product?.dimensions?.width || "",
      height: product?.dimensions?.height || ""
    }
  });

  // Product variants and options state
  const [variants, setVariants] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    if (currentOrganization) {
      fetchTagsAndCollections();
      if (product?.id) {
        fetchVariantsAndOptions();
      }
    }
  }, [currentOrganization, product]);

  const fetchTagsAndCollections = async () => {
    if (!currentOrganization) return;
    
    try {
      const [tagsResponse, collectionsResponse] = await Promise.all([
        supabase.from('tags').select('*').eq('organization_id', currentOrganization.id).order('name'),
        supabase.from('collections').select('*').eq('is_active', true).eq('organization_id', currentOrganization.id).order('name')
      ]);

      if (tagsResponse.data) setAvailableTags(tagsResponse.data);
      if (collectionsResponse.data) setAvailableCollections(collectionsResponse.data);
    } catch (error) {
      console.error('Error fetching tags and collections:', error);
    }
  };

  const fetchVariantsAndOptions = async () => {
    if (!product?.id) return;

    try {
      const [variantsResponse, optionsResponse] = await Promise.all([
        supabase.from('product_variants').select('*').eq('product_id', product.id).order('position'),
        supabase.from('product_options').select('*').eq('product_id', product.id).order('position')
      ]);

      if (variantsResponse.data) setVariants(variantsResponse.data);
      if (optionsResponse.data) setOptions(optionsResponse.data);
    } catch (error) {
      console.error('Error fetching variants and options:', error);
    }
  };

  const handleSave = async () => {
    try {
      const productData = {
        ...formData,
        variants,
        options
      };
      await onSave(productData);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6 gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                {formData.name || (product ? 'Edit Product' : 'Add Product')}
              </h1>
              {formData.isActive && (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  Actief
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>Annuleren</Button>
            <Button onClick={handleSave}>Opslaan</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Titel</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Korte mouwen t-shirt"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschrijf je product..."
                    rows={8}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                  onRemove={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                  label="Product afbeelding"
                />
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Prijzen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prijs</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0,00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original-price">Vergelijk prijs</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="original-price"
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="0,00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variants Section */}
            <ProductVariants 
              variants={variants}
              options={options}
              onVariantsChange={setVariants}
              onOptionsChange={setOptions}
            />

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Voorraad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (voorraadeenheid)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">Hoeveelheid</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle>Verzending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Gewicht</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="0,0 kg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">Lengte</Label>
                    <Input
                      id="length"
                      type="number"
                      value={formData.dimensions.length}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, length: e.target.value }
                      }))}
                      placeholder="0 cm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Breedte</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.dimensions.width}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, width: e.target.value }
                      }))}
                      placeholder="0 cm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-card p-6 space-y-6">
          
          {/* Product Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productstatus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={formData.isActive ? "active" : "draft"} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  isActive: value === "active" 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="draft">Concept</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Product Organization */}
          <ProductOrganization
            formData={formData}
            setFormData={setFormData}
            availableCollections={availableCollections}
            availableTags={availableTags}
          />

          {/* Product Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productbeschikbaarheid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Uitgelicht product</Label>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Nieuw product</Label>
                <Switch
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">In de uitverkoop</Label>
                <Switch
                  checked={formData.isSale}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSale: checked }))}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}