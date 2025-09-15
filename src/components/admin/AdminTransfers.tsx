import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowRight, Package, CheckCircle, Clock } from "lucide-react";

export function AdminTransfers() {
  const [transfers] = useState([
    {
      id: "TRF-001",
      from: "Main Warehouse",
      to: "Store Location A",
      products: 3,
      quantity: 25,
      status: "pending",
      created: "2024-01-15",
      expected: "2024-01-18"
    },
    {
      id: "TRF-002", 
      from: "Store Location B",
      to: "Main Warehouse",
      products: 1,
      quantity: 5,
      status: "completed",
      created: "2024-01-14",
      expected: "2024-01-16"
    },
    {
      id: "TRF-003",
      from: "Main Warehouse", 
      to: "Store Location C",
      products: 7,
      quantity: 42,
      status: "in_transit",
      created: "2024-01-13",
      expected: "2024-01-17"
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_transit":
        return <Badge variant="default"><ArrowRight className="w-3 h-3 mr-1" />In Transit</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingTransfers = transfers.filter(t => t.status === "pending").length;
  const inTransitTransfers = transfers.filter(t => t.status === "in_transit").length;
  const completedTransfers = transfers.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transfers</h2>
          <p className="text-muted-foreground">Manage inventory transfers between locations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Transfer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transfers.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTransfers}</div>
            <p className="text-xs text-muted-foreground">Awaiting shipment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <ArrowRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inTransitTransfers}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTransfers}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{transfer.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{transfer.to}</span>
                    </div>
                  </TableCell>
                  <TableCell>{transfer.products} items</TableCell>
                  <TableCell>{transfer.quantity} units</TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell>{transfer.created}</TableCell>
                  <TableCell>{transfer.expected}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}