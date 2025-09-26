import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface ImportJob {
  id: string;
  status: string;
  total_products: number;
  processed_products: number;
  successful_imports: number;
  failed_imports: number;
  created_at: string;
  started_at: string;
  completed_at: string;
}

interface ImportedProduct {
  id: string;
  source_url: string;
  processed_data: any;
  approval_status: string;
  created_at: string;
}

const AdminSheinImports = () => {
  const { currentOrganization } = useOrganization();
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [pendingProducts, setPendingProducts] = useState<ImportedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchImportData();
    }
  }, [currentOrganization]);

  const fetchImportData = async () => {
    try {
      setLoading(true);
      
      // Fetch import jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (jobsError) throw jobsError;
      setImportJobs(jobs || []);

      // Fetch pending products
      const { data: products, error: productsError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (productsError) throw productsError;
      setPendingProducts(products || []);

    } catch (error) {
      console.error('Error fetching import data:', error);
      toast({
        title: "Error",
        description: "Failed to load import data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({ 
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product approved successfully",
      });

      fetchImportData();
    } catch (error) {
      console.error('Error approving product:', error);
      toast({
        title: "Error",
        description: "Failed to approve product",
        variant: "destructive",
      });
    }
  };

  const rejectProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({ approval_status: 'rejected' })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product rejected",
      });

      fetchImportData();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast({
        title: "Error",
        description: "Failed to reject product",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SHEIN Product Imports</h1>
        <Button onClick={fetchImportData}>Refresh</Button>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approval ({pendingProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {importJobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Import Job</CardTitle>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Products:</span>
                    <div>{job.total_products}</div>
                  </div>
                  <div>
                    <span className="font-medium">Processed:</span>
                    <div>{job.processed_products}</div>
                  </div>
                  <div>
                    <span className="font-medium">Successful:</span>
                    <div className="text-green-600">{job.successful_imports}</div>
                  </div>
                  <div>
                    <span className="font-medium">Failed:</span>
                    <div className="text-red-600">{job.failed_imports}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Created: {new Date(job.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">
                      {product.processed_data?.name || 'Unnamed Product'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Price: ${product.processed_data?.price || 0} {product.processed_data?.currency || 'USD'}
                    </p>
                    <a 
                      href={product.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Source
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveProduct(product.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectProduct(product.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingProducts.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No products pending approval
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSheinImports;