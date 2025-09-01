import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { CollectionForm } from "./CollectionForm";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function AdminCollections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  // Fetch collections with product counts
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["admin-collections", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          product_collections (
            product_id
          )
        `)
        .eq("organization_id", currentOrganization.id)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      
      return data?.map(collection => ({
        ...collection,
        product_count: collection.product_collections?.length || 0
      })) as (Collection & { product_count: number })[];
    },
    enabled: !!currentOrganization,
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      setDeleteId(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCollection = () => {
    setEditingCollection(null);
    setShowForm(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowForm(true);
  };

  const handleSaveCollection = async (collectionData: any) => {
    if (!currentOrganization) return;
    
    try {
      if (editingCollection) {
        // Update existing collection
        const { error } = await supabase
          .from("collections")
          .update({
            name: collectionData.name,
            slug: collectionData.slug,
            description: collectionData.description,
            image_url: collectionData.image_url,
            is_active: collectionData.is_active,
            sort_order: collectionData.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCollection.id);

        if (error) throw error;
      } else {
        // Create new collection
        const { error } = await supabase
          .from("collections")
          .insert({
            name: collectionData.name,
            slug: collectionData.slug,
            description: collectionData.description,
            image_url: collectionData.image_url,
            is_active: collectionData.is_active,
            sort_order: collectionData.sort_order,
            organization_id: currentOrganization.id,
          });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      setShowForm(false);
      setEditingCollection(null);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDeleteCollection = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (showForm) {
    return (
      <CollectionForm
        collection={editingCollection}
        onSave={handleSaveCollection}
        onCancel={() => {
          setShowForm(false);
          setEditingCollection(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground">Manage your product collections</p>
        </div>
        <Button onClick={handleAddCollection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collection
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Collections ({filteredCollections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No collections found</p>
              <Button onClick={handleAddCollection} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create your first collection
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                          {collection.image_url ? (
                            <img 
                              src={collection.image_url} 
                              alt={collection.name}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{collection.name}</p>
                          {collection.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {collection.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        /{collection.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{(collection as any).product_count}</span>
                        <span className="text-sm text-muted-foreground">
                          {(collection as any).product_count === 1 ? 'product' : 'products'}
                        </span>
                        {(collection as any).product_count === 0 && (
                          <Badge variant="outline" className="text-xs">Empty</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={collection.is_active ? "default" : "secondary"}>
                        {collection.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{collection.sort_order}</TableCell>
                    <TableCell>
                      {new Date(collection.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/collections/${collection.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCollection(collection)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCollection(collection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}