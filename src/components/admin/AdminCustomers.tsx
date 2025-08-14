import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MoreHorizontal, Eye, Mail, Phone, Plus, Edit, Trash2 } from "lucide-react";
import { CustomerForm } from "./CustomerForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Fetch customer statistics
  const { data: customerStats = { total: 0, newThisMonth: 0, vipCount: 0, avgOrderValue: 0 } } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      // Since we don't have real customer data yet, return zeros
      // This will be updated when we have real profiles and orders
      return {
        total: 0,
        newThisMonth: 0,
        vipCount: 0,
        avgOrderValue: 0
      };
    }
  });

  // Since we don't have real customer data in profiles yet, show empty state
  const customers: any[] = [];

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vip":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">VIP</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCustomerValue = (totalSpent: string) => {
    const amount = parseInt(totalSpent.replace(/[$,]/g, ''));
    if (amount >= 2000) return "text-yellow-600"; // VIP
    if (amount >= 1000) return "text-green-600"; // High value
    if (amount >= 500) return "text-blue-600"; // Medium value
    return "text-muted-foreground"; // Low value
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleSaveCustomer = (customerData: any) => {
    console.log('Saving customer:', customerData);
    setShowCustomerForm(false);
    setEditingCustomer(null);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage customer relationships and data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Customers
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send Newsletter
          </Button>
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{customerStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{customerStats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">New This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{customerStats.vipCount}</div>
            <p className="text-xs text-muted-foreground">VIP Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">€{customerStats.avgOrderValue}</div>
            <p className="text-xs text-muted-foreground">Avg. Order Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                          <Mail className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">No customers yet</p>
                          <p className="text-sm">Customer profiles will appear here when orders are placed</p>
                        </div>
                        <Button onClick={handleAddCustomer} className="mt-2">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Customer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {customer.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(customer.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{customer.email}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{customer.orders}</span>
                        <span className="text-xs text-muted-foreground ml-1">orders</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getCustomerValue(customer.totalSpent)}`}>
                          {customer.totalSpent}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.lastOrder).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditCustomer(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <p>Showing {filteredCustomers.length} of {customers.length} customers</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}