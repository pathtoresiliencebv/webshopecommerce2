import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Gift, CreditCard, TrendingUp, Users } from "lucide-react";

export function AdminGiftCards() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [giftCards] = useState([]);

  const filteredGiftCards = giftCards.filter(card =>
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "partially_used":
        return <Badge variant="secondary">Partially Used</Badge>;
      case "used":
        return <Badge variant="outline">Fully Used</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeCards = giftCards.filter(c => c.status === "active").length;
  const totalValue = giftCards.reduce((sum, c) => sum + c.value, 0);
  const totalBalance = giftCards.reduce((sum, c) => sum + c.balance, 0);
  const totalRedeemed = totalValue - totalBalance;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gift Cards</h2>
          <p className="text-muted-foreground">Manage gift cards and customer balances</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Gift Card
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCards}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{totalRedeemed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Successfully used</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">€{totalBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Remaining value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Gift Card Management</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gift cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gift Card Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Original Value</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGiftCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No gift cards found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGiftCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono text-sm">{card.code}</TableCell>
                    <TableCell>{card.customer}</TableCell>
                    <TableCell>€{card.value.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">€{card.balance.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(card.status)}</TableCell>
                    <TableCell>{card.created}</TableCell>
                    <TableCell>{card.expires}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}