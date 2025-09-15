import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MoreHorizontal, Eye, Mail, Phone, Plus, Edit, Trash2 } from "lucide-react";
import { CustomerForm } from "./CustomerForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch customer statistics
  const { data: customerStats = { total: 0, newThisMonth: 0, vipCount: 0, avgOrderValue: 0 } } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      // Mock data for now - replace with real queries later
      return {
        total: 1234,
        newThisMonth: 89,
        vipCount: 45,
        avgOrderValue: 184.50
      };
    }
  });

  // Fetch customers from database
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id
  });

  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    
    return matchesSearch;
  });

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleSaveCustomer = (customerData: any) => {
    toast.success('Customer saved successfully');
    setShowCustomerForm(false);
    setEditingCustomer(null);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleDeleteCustomer = (customerId: string) => {
    console.log('Deleting customer:', customerId);
  };

  if (showCustomerForm) {
    return (
      <CustomerForm
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        onCancel={() => setShowCustomerForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal klanten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nieuw deze maand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{customerStats.newThisMonth}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP klanten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{customerStats.vipCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. bestelwaarde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{customerStats.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Klantendirectory</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Beheer je klanten en bekijk hun bestellingsgeschiedenis
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Send Newsletter
              </Button>
              <Button onClick={handleAddCustomer} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">No customers found</div>
              <Button onClick={handleAddCustomer} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add your first customer
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bestellingen</TableHead>
                    <TableHead>Totaal besteed</TableHead>
                    <TableHead>Laatste bestelling</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Toegevoegd: {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{customer.email || 'Geen email'}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone || 'Geen telefoon'}</div>
                      </TableCell>
                      <TableCell>
                        <div>0</div>
                        <div className="text-sm text-muted-foreground">bestellingen</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">€0.00</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">Geen bestellingen</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Nieuw</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}