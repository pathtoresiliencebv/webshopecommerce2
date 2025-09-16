import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Copy, MoreHorizontal, Edit, Trash2, BarChart3 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { DiscountCodeForm } from "./DiscountCodeForm";
import { format } from "date-fns";

export function AdminDiscountCodes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<any>(null);

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch discount codes
  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ["discount-codes", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["discount-stats", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return { totalCodes: 0, activeCodes: 0, totalUses: 0, totalDiscount: 0 };
      
      const { data: codes, error } = await supabase
        .from("discount_codes")
        .select("is_active, used_count, value, type")
        .eq("organization_id", currentOrganization.id);
      
      if (error) throw error;
      
      const totalCodes = codes.length;
      const activeCodes = codes.filter(c => c.is_active).length;
      const totalUses = codes.reduce((sum, code) => sum + (code.used_count || 0), 0);
      
      // Calculate total discount given (approximate)
      const totalDiscount = codes.reduce((sum, code) => {
        const uses = code.used_count || 0;
        if (code.type === 'fixed') {
          return sum + (uses * code.value);
        } else if (code.type === 'percentage') {
          // This is an approximation - we'd need order data for exact calculation
          return sum + (uses * code.value * 2); // Assuming average order of €200
        }
        return sum;
      }, 0);
      
      return { totalCodes, activeCodes, totalUses, totalDiscount };
    },
    enabled: !!currentOrganization
  });

  const filteredCodes = discountCodes.filter((code) => {
    const matchesSearch = 
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (code.description && code.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const handleCreateCode = () => {
    setSelectedDiscount(null);
    setIsFormOpen(true);
  };

  const handleEditCode = (code: any) => {
    setSelectedDiscount(code);
    setIsFormOpen(true);
  };

  const handleDeleteCode = (code: any) => {
    setDiscountToDelete(code);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!discountToDelete) return;

    try {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", discountToDelete.id);

      if (error) throw error;

      toast({
        title: "Kortingscode verwijderd",
        description: `Code "${discountToDelete.code}" is succesvol verwijderd.`
      });

      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      queryClient.invalidateQueries({ queryKey: ["discount-stats"] });
    } catch (error) {
      console.error("Error deleting discount code:", error);
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het verwijderen van de kortingscode.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedDiscount) {
        // Update existing code
        const { error } = await supabase
          .from("discount_codes")
          .update({
            code: formData.code,
            type: formData.type,
            value: formData.value,
            minimum_order_amount: formData.minimum_order_amount || 0,
            usage_limit: formData.usage_limit,
            expires_at: formData.expires_at?.toISOString(),
            description: formData.description,
            is_active: formData.is_active
          })
          .eq("id", selectedDiscount.id);

        if (error) throw error;

        toast({
          title: "Kortingscode bijgewerkt",
          description: `Code "${formData.code}" is succesvol bijgewerkt.`
        });
      } else {
        // Create new code
        const { error } = await supabase
          .from("discount_codes")
          .insert({
            organization_id: currentOrganization!.id,
            code: formData.code,
            type: formData.type,
            value: formData.value,
            minimum_order_amount: formData.minimum_order_amount || 0,
            usage_limit: formData.usage_limit,
            expires_at: formData.expires_at?.toISOString(),
            description: formData.description,
            is_active: formData.is_active,
            used_count: 0
          });

        if (error) throw error;

        toast({
          title: "Kortingscode aangemaakt",
          description: `Code "${formData.code}" is succesvol aangemaakt.`
        });
      }

      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      queryClient.invalidateQueries({ queryKey: ["discount-stats"] });
      setIsFormOpen(false);
      setSelectedDiscount(null);
    } catch (error: any) {
      console.error("Error saving discount code:", error);
      
      let errorMessage = "Er is een fout opgetreden bij het opslaan van de kortingscode.";
      if (error.code === "23505") {
        errorMessage = "Deze kortingscode bestaat al. Kies een andere code.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (code: any) => {
    const now = new Date();
    const expiresAt = code.expires_at ? new Date(code.expires_at) : null;
    
    if (!code.is_active) {
      return <Badge variant="destructive">Inactief</Badge>;
    }
    
    if (expiresAt && expiresAt < now) {
      return <Badge variant="outline">Verlopen</Badge>;
    }
    
    if (code.usage_limit && code.used_count >= code.usage_limit) {
      return <Badge variant="outline">Limiet Bereikt</Badge>;
    }
    
    return <Badge variant="default">Actief</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "percentage":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Percentage</Badge>;
      case "fixed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Vast Bedrag</Badge>;
      case "free_shipping":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Gratis Verzending</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatValue = (code: any) => {
    switch (code.type) {
      case "percentage":
        return `${code.value}%`;
      case "fixed":
        return `€${code.value}`;
      case "free_shipping":
        return "Gratis Verzending";
      default:
        return code.value;
    }
  };

  const getUsagePercentage = (usage: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.round((usage / limit) * 100);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code gekopieerd",
      description: `Kortingscode "${code}" is gekopieerd naar het klembord.`
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discount Codes</h1>
          <p className="text-muted-foreground">Create and manage promotional discount codes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={handleCreateCode}>
            <Plus className="mr-2 h-4 w-4" />
            Kortingscode Aanmaken
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats?.totalCodes || 0}</div>
            <p className="text-xs text-muted-foreground">Totaal Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats?.activeCodes || 0}</div>
            <p className="text-xs text-muted-foreground">Actieve Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats?.totalUses || 0}</div>
            <p className="text-xs text-muted-foreground">Totaal Gebruikt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">€{Math.round(stats?.totalDiscount || 0)}</div>
            <p className="text-xs text-muted-foreground">Korting Gegeven</p>
          </CardContent>
        </Card>
      </div>

      {/* Discount Codes Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discount codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Codes Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyCode(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                    </TableCell>
                    <TableCell>{getTypeBadge(code.type)}</TableCell>
                    <TableCell className="font-medium">{formatValue(code)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{code.used_count || 0}</span>
                          {code.usage_limit && (
                            <span className="text-xs text-muted-foreground">/ {code.usage_limit}</span>
                          )}
                        </div>
                        {code.usage_limit && (
                          <div className="w-full bg-muted rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all"
                              style={{ width: `${getUsagePercentage(code.used_count || 0, code.usage_limit)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(code.created_at), "dd/MM/yyyy")}</p>
                        {code.expires_at && (
                          <p className="text-muted-foreground">tot {format(new Date(code.expires_at), "dd/MM/yyyy")}</p>
                        )}
                        {!code.expires_at && (
                          <p className="text-muted-foreground">Geen vervaldatum</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditCode(code)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCode(code)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <p>Toont {filteredCodes.length} van {discountCodes.length} kortingscodes</p>
          </div>
        </CardContent>
      </Card>

      {/* Forms and Dialogs */}
      <DiscountCodeForm
        discount={selectedDiscount}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDiscount(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kortingscode Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je de kortingscode "{discountToDelete?.code}" wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}