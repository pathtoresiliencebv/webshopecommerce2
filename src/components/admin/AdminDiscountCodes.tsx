import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Copy, MoreHorizontal, Edit, Trash2, BarChart3 } from "lucide-react";

const discountCodes = [
  {
    id: "1",
    code: "WELCOME20",
    type: "percentage",
    value: "20%",
    description: "Welcome discount for new customers",
    usage: 234,
    limit: 1000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "active"
  },
  {
    id: "2",
    code: "FREESHIP",
    type: "free-shipping",
    value: "Free Shipping",
    description: "Free shipping on all orders",
    usage: 567,
    limit: null,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "active"
  },
  {
    id: "3",
    code: "SUMMER50",
    type: "fixed",
    value: "$50",
    description: "Summer sale discount",
    usage: 145,
    limit: 500,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    status: "expired"
  },
  {
    id: "4",
    code: "BLACKFRIDAY",
    type: "percentage",
    value: "30%",
    description: "Black Friday mega sale",
    usage: 0,
    limit: 2000,
    startDate: "2024-11-29",
    endDate: "2024-11-29",
    status: "scheduled"
  },
  {
    id: "5",
    code: "NEWUSER",
    type: "percentage",
    value: "15%",
    description: "First time buyer discount",
    usage: 89,
    limit: 100,
    startDate: "2024-11-01",
    endDate: "2024-11-30",
    status: "inactive"
  }
];

export function AdminDiscountCodes() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCodes = discountCodes.filter((code) => {
    const matchesSearch = 
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "expired":
        return <Badge variant="outline">Expired</Badge>;
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "percentage":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Percentage</Badge>;
      case "fixed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Fixed Amount</Badge>;
      case "free-shipping":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Free Ship</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getUsagePercentage = (usage: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.round((usage / limit) * 100);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Total Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Active Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">1,035</div>
            <p className="text-xs text-muted-foreground">Total Uses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">Discount Given</p>
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
                    <TableCell className="font-medium">{code.value}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{code.usage}</span>
                          {code.limit && (
                            <span className="text-xs text-muted-foreground">/ {code.limit}</span>
                          )}
                        </div>
                        {code.limit && (
                          <div className="w-full bg-muted rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all"
                              style={{ width: `${getUsagePercentage(code.usage, code.limit)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(code.startDate).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">to {new Date(code.endDate).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(code.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
            <p>Showing {filteredCodes.length} of {discountCodes.length} discount codes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}