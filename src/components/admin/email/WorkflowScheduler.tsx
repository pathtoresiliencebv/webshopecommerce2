import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlayCircle, PauseCircle, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  organization_id: string;
  workflow_trigger_id: string;
  subscriber_id: string;
  campaign_id: string;
  scheduled_for: string;
  status: string;
  attempts: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
  email_campaigns: {
    name: string;
    subject: string;
  } | null;
  email_subscribers: {
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

interface WorkflowSchedulerProps {
  onRefresh?: () => void;
}

export const WorkflowScheduler: React.FC<WorkflowSchedulerProps> = ({ onRefresh }) => {
  const { currentOrganization } = useOrganization();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchQueueItems = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('workflow_queue')
        .select(`
          *,
          email_campaigns (name, subject),
          email_subscribers (email, first_name, last_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('scheduled_for', { ascending: true })
        .limit(50);

      if (error) throw error;
      setQueueItems((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching queue items:', error);
      toast.error('Failed to load scheduled emails');
    } finally {
      setLoading(false);
    }
  };

  const processWorkflows = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-workflows');
      
      if (error) throw error;
      
      toast.success(`Processed ${data.processed} workflow items`);
      fetchQueueItems();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error processing workflows:', error);
      toast.error('Failed to process workflows');
    } finally {
      setProcessing(false);
    }
  };

  const cancelQueueItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_queue')
        .update({ status: 'cancelled' })
        .eq('id', itemId);

      if (error) throw error;
      
      toast.success('Email cancelled');
      fetchQueueItems();
    } catch (error: any) {
      console.error('Error cancelling email:', error);
      toast.error('Failed to cancel email');
    }
  };

  useEffect(() => {
    fetchQueueItems();
  }, [currentOrganization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingItems = queueItems.filter(item => item.status === 'pending');
  const sentItems = queueItems.filter(item => item.status === 'sent');
  const failedItems = queueItems.filter(item => item.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={processWorkflows}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Process Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Emails
          </CardTitle>
          <CardDescription>
            Upcoming and recent email sends from automated workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled emails found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.email_campaigns?.name || 'Unknown Campaign'}</h4>
                      <p className="text-sm text-muted-foreground">
                        To: {item.email_subscribers?.first_name} {item.email_subscribers?.last_name} 
                        ({item.email_subscribers?.email || 'Unknown'})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Subject: {item.email_campaigns?.subject || 'No subject'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          item.status === 'pending' ? 'default' :
                          item.status === 'sent' ? 'secondary' :
                          item.status === 'failed' ? 'destructive' : 'outline'
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelQueueItem(item.id)}
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Scheduled: {new Date(item.scheduled_for).toLocaleString()}
                    </span>
                    {item.sent_at && (
                      <span>
                        Sent: {new Date(item.sent_at).toLocaleString()}
                      </span>
                    )}
                    {item.attempts > 0 && (
                      <span>Attempts: {item.attempts}</span>
                    )}
                  </div>
                  {item.error_message && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {item.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};