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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Upload, Tag, Folder } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { SEOPreview } from "./SEOPreview";

interface ProductFormProps {
  product?: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}

// Remove hardcoded arrays - will be fetched from database

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

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const [newTag, setNewTag] = useState("");
  const [newCollection, setNewCollection] = useState("");

  useEffect(() => {
    if (currentOrganization) {
      fetchTagsAndCollections();
    }
  }, [currentOrganization]);

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

  const handleAddTag = async (tagName: string) => {
    if (!tagName || formData.tags.includes(tagName) || !currentOrganization) return;

    try {
      // Check if tag exists, if not create it
      let tag = availableTags.find(t => t.name === tagName);
      
      if (!tag) {
        const { data, error } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            organization_id: currentOrganization.id
          })
          .select()
          .single();

        if (error) throw error;
        tag = data;
        setAvailableTags(prev => [...prev, tag]);
      }

      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName]
      }));
    } catch (error: any) {
      console.error("Failed to add tag:", error);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddCollection = async (collectionName: string) => {
    if (!collectionName || formData.collections.includes(collectionName) || !currentOrganization) return;

    try {
      // Check if collection exists, if not create it
      let collection = availableCollections.find(c => c.name === collectionName);
      
      if (!collection) {
        const { data, error } = await supabase
          .from('collections')
          .insert({
            name: collectionName,
            slug: collectionName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            organization_id: currentOrganization.id
          })
          .select()
          .single();

        if (error) throw error;
        collection = data;
        setAvailableCollections(prev => [...prev, collection]);
      }

      setFormData(prev => ({
        ...prev,
        collections: [...prev.collections, collectionName]
      }));
    } catch (error: any) {
      console.error("Failed to add collection:", error);
    }
    setNewCollection("");
  };

  const handleRemoveCollection = (collectionToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      collections: prev.collections.filter(collection => collection !== collectionToRemove)
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Product</Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tags-collections">Tags & Collections</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Product SKU"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chairs">Chairs</SelectItem>
                    <SelectItem value="desks">Desks</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-description">Short Description</Label>
                <Textarea
                  id="short-description"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Brief product description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed product description"
                  rows={6}
                />
              </div>

              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                label="Product Image"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, length: e.target.value }
                    }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, width: e.target.value }
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions, height: e.target.value }
                  }))}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags-collections" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Product Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Add Existing Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.filter(tag => !formData.tags.includes(tag.name)).map((tag) => (
                      <Button
                        key={tag.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTag(tag.name)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-tag">Create New Tag</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter new tag"
                    />
                    <Button onClick={() => handleAddTag(newTag)}>Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Collections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.collections.map((collection) => (
                    <Badge key={collection} variant="default" className="flex items-center gap-1">
                      {collection}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveCollection(collection)}
                      />
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Add to Existing Collections</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableCollections.filter(collection => !formData.collections.includes(collection.name)).map((collection) => (
                      <Button
                        key={collection.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCollection(collection.name)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {collection.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-collection">Create New Collection</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-collection"
                      value={newCollection}
                      onChange={(e) => setNewCollection(e.target.value)}
                      placeholder="Enter new collection"
                    />
                    <Button onClick={() => handleAddCollection(newCollection)}>Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Current Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original-price">Original Price (€)</Label>
                  <Input
                    id="original-price"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Active Product</Label>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Featured Product</Label>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>New Product</Label>
                    <Switch
                      checked={formData.isNew}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>On Sale</Label>
                    <Switch
                      checked={formData.isSale}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSale: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Meta Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="SEO optimized title (max 60 characters)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">{formData.metaTitle.length}/60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="SEO optimized description (max 160 characters)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">{formData.metaDescription.length}/160 characters</p>
                </div>
              </CardContent>
            </Card>

            <SEOPreview
              title={formData.metaTitle || formData.name}
              description={formData.metaDescription || formData.shortDescription}
              slug={generateSlug(formData.name)}
              type="product"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}