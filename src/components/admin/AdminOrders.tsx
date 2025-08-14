import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, MoreHorizontal, Eye, Printer } from "lucide-react";

const orders = [
  {
    id: "ORD-20241201-1234",
    customer: "John Smith",
    email: "john@example.com",
    products: ["Ergonomic Office Chair Pro"],
    total: "$299",
    status: "shipped",
    date: "2024-12-01",
    shippingAddress: "123 Main St, New York, NY"
  },
  {
    id: "ORD-20241201-1235",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    products: ["Standing Desk Premium", "Storage Cabinet"],
    total: "$798",
    status: "processing",
    date: "2024-12-01",
    shippingAddress: "456 Oak Ave, Los Angeles, CA"
  },
  {
    id: "ORD-20241201-1236",
    customer: "Mike Wilson",
    email: "mike@example.com",
    products: ["Storage Cabinet"],
    total: "$199",
    status: "delivered",
    date: "2024-11-30",
    shippingAddress: "789 Pine St, Chicago, IL"
  },
  {
    id: "ORD-20241201-1237",
    customer: "Emily Davis",
    email: "emily@example.com",
    products: ["Executive Leather Chair"],
    total: "$449",
    status: "pending",
    date: "2024-11-30",
    shippingAddress: "321 Elm St, Houston, TX"
  },
  {
    id: "ORD-20241201-1238",
    customer: "David Brown",
    email: "david@example.com",
    products: ["Minimalist Work Desk"],
    total: "$349",
    status: "shipped",
    date: "2024-11-29",
    shippingAddress: "654 Maple Dr, Phoenix, AZ"
  }
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

export function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge variant="default">Delivered</Badge>;
      case "shipped":
        return <Badge variant="secondary">Shipped</Badge>;
      case "processing":
        return <Badge variant="outline">Processing</Badge>;
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, or emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        {order.products.map((product, index) => (
                          <p key={index} className="text-sm truncate">
                            {product}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.total}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Printer className="h-4 w-4" />
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
            <p>Showing {filteredOrders.length} of {orders.length} orders</p>
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