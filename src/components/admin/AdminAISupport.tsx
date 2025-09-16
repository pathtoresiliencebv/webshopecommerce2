import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ChatSession {
  id: string;
  session_token: string;
  user_id: string | null;
  status: string | null;
  customer_context: any;
  created_at: string;
  updated_at: string;
  lastMessage?: string;
  messageCount?: number;
}

interface Conversation {
  id: string;
  session_id: string;
  message_type: string;
  content: string;
  created_at: string;
}

interface AnalyticsData {
  totalConversations: number;
  aiResolved: number;
  escalated: number;
  avgResponseTime: number;
  customerSatisfaction: number;
}

const AdminAISupport: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    aiResolved: 0,
    escalated: 0,
    avgResponseTime: 0,
    customerSatisfaction: 0
  });
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      loadSessions();
      loadAnalytics();
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (selectedSession) {
      loadConversations(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    if (!currentOrganization?.id) return;

    const { data, error } = await supabase
      .from('chatbot_sessions')
      .select(`
        *,
        chatbot_conversations (
          content,
          created_at,
          message_type
        )
      `)
      .eq('organization_id', currentOrganization.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    const sessionsWithMetadata = data.map(session => ({
      ...session,
      lastMessage: session.chatbot_conversations[session.chatbot_conversations.length - 1]?.content || '',
      messageCount: session.chatbot_conversations.length
    })) as ChatSession[];

    setSessions(sessionsWithMetadata);
  };

  const loadConversations = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations((data || []) as Conversation[]);
  };

  const loadAnalytics = async () => {
    if (!currentOrganization?.id) return;

    // Get basic session stats
    const { data: sessionStats } = await supabase
      .from('chatbot_sessions')
      .select('status')
      .eq('organization_id', currentOrganization.id);

    const totalConversations = sessionStats?.length || 0;
    const escalated = sessionStats?.filter(s => s.status === 'escalated').length || 0;
    const resolved = sessionStats?.filter(s => s.status === 'resolved').length || 0;
    const aiResolved = resolved - escalated;

    setAnalytics({
      totalConversations,
      aiResolved,
      escalated,
      avgResponseTime: 45, // Mock data - would calculate from actual response times
      customerSatisfaction: 4.2 // Mock data - would come from satisfaction surveys
    });
  };

  const sendAgentMessage = async () => {
    if (!newMessage.trim() || !selectedSession || isLoading) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .insert({
          session_id: selectedSession.id,
          message_type: 'agent',
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadConversations(selectedSession.id);

      toast({
        title: "Message sent",
        description: "Your message has been delivered to the customer.",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resolveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_sessions')
        .update({ status: 'resolved' })
        .eq('id', sessionId);

      if (error) throw error;

      loadSessions();
      toast({
        title: "Session resolved",
        description: "The conversation has been marked as resolved.",
      });
    } catch (error: any) {
      console.error('Error resolving session:', error);
      toast({
        title: "Error",
        description: "Failed to resolve session.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary">Active</Badge>;
      case 'escalated':
        return <Badge variant="destructive">Escalated</Badge>;
      case 'resolved':
        return <Badge variant="default">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">AI Customer Support</h2>
        <p className="text-muted-foreground">
          Manage AI conversations and provide human support when needed
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.aiResolved}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalConversations > 0 ? Math.round((analytics.aiResolved / analytics.totalConversations) * 100) : 0}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.escalated}</div>
            <p className="text-xs text-muted-foreground">
              Requires human attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              -5s from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Active Conversations</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="settings">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conversations</span>
                  <Badge variant="outline">{sessions.length}</Badge>
                </CardTitle>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                        selectedSession?.id === session.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">
                          Session #{session.session_token.slice(-8)}
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {session.lastMessage || 'No messages yet'}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {session.messageCount || 0} messages
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversation View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedSession ? (
                    <span>Conversation #{selectedSession.session_token.slice(-8)}</span>
                  ) : (
                    <span>Select a Conversation</span>
                  )}
                  {selectedSession && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveSession(selectedSession.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="max-h-80 overflow-y-auto space-y-3 border rounded p-4">
                      {conversations.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.message_type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              message.message_type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : message.message_type === 'agent'
                                ? 'bg-secondary text-secondary-foreground'
                                : message.message_type === 'system'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-accent text-accent-foreground'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.message_type} • {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Box */}
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        onClick={sendAgentMessage}
                        disabled={isLoading || !newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a conversation to view details and respond
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Management</CardTitle>
              <CardDescription>
                Manage AI knowledge base content and FAQs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Knowledge base management coming soon
                </p>
                <Button variant="outline">Add Knowledge Entry</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI behavior and escalation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  AI settings configuration coming soon
                </p>
                <Button variant="outline">Configure AI</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAISupport;