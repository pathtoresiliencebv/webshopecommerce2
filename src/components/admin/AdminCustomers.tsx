import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MoreHorizontal, Eye, Mail, Phone, Plus, Edit, Trash2 } from "lucide-react";
import { CustomerForm } from "./CustomerForm";

const customers = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 555 123 4567",
    orders: 5,
    totalSpent: "$1,247",
    lastOrder: "2024-12-01",
    status: "active",
    joinDate: "2024-01-15"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 555 234 5678",
    orders: 3,
    totalSpent: "$892",
    lastOrder: "2024-11-28",
    status: "active",
    joinDate: "2024-03-22"
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike@example.com",
    phone: "+1 555 345 6789",
    orders: 8,
    totalSpent: "$2,156",
    lastOrder: "2024-11-30",
    status: "vip",
    joinDate: "2023-11-10"
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "+1 555 456 7890",
    orders: 1,
    totalSpent: "$449",
    lastOrder: "2024-11-30",
    status: "new",
    joinDate: "2024-11-30"
  },
  {
    id: "5",
    name: "David Brown",
    email: "david@example.com",
    phone: "+1 555 567 8901",
    orders: 12,
    totalSpent: "$3,489",
    lastOrder: "2024-11-25",
    status: "vip",
    joinDate: "2023-08-14"
  }
];

export function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
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
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">New This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">VIP Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">$2,156</div>
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
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {customer.name.split(' ').map(n => n[0]).join('')}
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
                ))}
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