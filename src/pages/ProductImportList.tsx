/**
 * PRODUCT IMPORT LIST
 * 
 * Manage imported products from SHEIN per store
 * Shows import history and pending imports
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Download, ExternalLink, Check, X, Clock, 
  Search, Filter, RefreshCw, Package 
} from 'lucide-react';

interface ImportedProduct {
  id: string;
  source_platform: string;
  source_product_id: string;
  source_url: string;
  name: string;
  price: number;
  status: 'pending' | 'imported' | 'failed';
  imported_at?: string;
  created_at: string;
}

export default function ProductImportList() {
  const { store } = useStore();
  const { currentOrganization } = useOrganization();
  const organizationId = store?.id || currentOrganization?.id;
  
  const [imports, setImports] = useState<ImportedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (organizationId) {
      loadImports();
    }
  }, [organizationId]);

  const loadImports = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);

      // Get products with source platform (imported products)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .not('source_platform', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedImports: ImportedProduct[] = (data || []).map(product => ({
        id: product.id,
        source_platform: product.source_platform || '',
        source_product_id: product.source_product_id || '',
        source_url: product.source_url || '',
        name: product.name,
        price: Number(product.price),
        status: product.is_active ? 'imported' : 'pending',
        imported_at: product.is_active ? product.created_at : undefined,
        created_at: product.created_at,
      }));

      setImports(mappedImports);
    } catch (error) {
      console.error('Error loading imports:', error);
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadImports();
    toast.success('Import list refreshed');
  };

  const filteredImports = imports.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source_product_id.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'imported':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Imported</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shein':
        return '🛍️';
      case 'aliexpress':
        return '🔶';
      case 'amazon':
        return '📦';
      default:
        return '🌐';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading imports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Import List</h2>
          <p className="text-muted-foreground">
            Manage products imported from external sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            // Open Chrome extension
            toast.info('Open Chrome extension to import products');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Import Products
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Imports</CardDescription>
            <CardTitle className="text-3xl">{imports.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Imported</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {imports.filter(i => i.status === 'imported').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {imports.filter(i => i.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>From SHEIN</CardDescription>
            <CardTitle className="text-3xl">
              {imports.filter(i => i.source_platform === 'shein').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by product name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'imported' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('imported')}
          >
            Imported
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </Button>
        </div>
      </div>

      {/* Import List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            {filteredImports.length} {filteredImports.length === 1 ? 'product' : 'products'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredImports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No imported products found</p>
              <p className="text-sm mt-2">Use the Chrome extension to import products from SHEIN</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source ID</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getPlatformIcon(item.source_platform)}</span>
                        <span className="capitalize">{item.source_platform}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {item.source_product_id}
                      </code>
                    </TableCell>
                    <TableCell>€{item.price.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.imported_at 
                        ? new Date(item.imported_at).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.source_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chrome Extension Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            How to Import Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>1. Install the Aurelio Chrome Extension</p>
          <p>2. Navigate to SHEIN product pages</p>
          <p>3. Right-click and select "Import to {store?.name || 'Store'}"</p>
          <p>4. Products will appear here for review</p>
        </CardContent>
      </Card>
    </div>
  );
}
