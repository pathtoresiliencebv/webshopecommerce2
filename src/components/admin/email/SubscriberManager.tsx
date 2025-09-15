import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Download, 
  Upload, 
  Plus,
  Mail,
  Filter,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Tag,
  Calendar
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  tags: string[];
  subscription_source: string;
  subscribed_at: string;
  custom_fields: any;
}

interface SubscriberManagerProps {
  subscribers: Subscriber[];
  onAdd: (subscriber: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onBulkAction: (action: string, subscriberIds: string[]) => void;
}

export function SubscriberManager({ 
  subscribers, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onBulkAction 
}: SubscriberManagerProps) {
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    tags: []
  });

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = !searchQuery || 
      subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${subscriber.first_name} ${subscriber.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && subscriber.is_active) ||
      (statusFilter === 'inactive' && !subscriber.is_active);
    
    const matchesSource = sourceFilter === 'all' || subscriber.subscription_source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const handleSelectSubscriber = (subscriberId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers([...selectedSubscribers, subscriberId]);
    } else {
      setSelectedSubscribers(selectedSubscribers.filter(id => id !== subscriberId));
    }
  };

  const handleAddSubscriber = () => {
    if (!newSubscriber.email.trim()) {
      toast({
        title: "Error",
        description: "Email address is required",
        variant: "destructive"
      });
      return;
    }

    onAdd({
      ...newSubscriber,
      subscription_source: 'manual',
      is_active: true
    });

    setNewSubscriber({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      tags: []
    });
    setShowAddDialog(false);
  };

  const handleBulkAction = (action: string) => {
    if (selectedSubscribers.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select subscribers first",
        variant: "destructive"
      });
      return;
    }

    onBulkAction(action, selectedSubscribers);
    setSelectedSubscribers([]);
  };

  const exportSubscribers = () => {
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Phone', 'Status', 'Source', 'Subscribed Date', 'Tags'].join(','),
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.first_name || '',
        sub.last_name || '',
        sub.phone || '',
        sub.is_active ? 'Active' : 'Inactive',
        sub.subscription_source,
        new Date(sub.subscribed_at).toLocaleDateString(),
        sub.tags.join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sources = [...new Set(subscribers.map(s => s.subscription_source))];
  const totalActive = subscribers.filter(s => s.is_active).length;
  const totalInactive = subscribers.length - totalActive;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Subscriber Management</h3>
          <p className="text-muted-foreground">Manage your email subscriber list</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Subscribers</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Upload CSV File</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    CSV should include: email, first_name, last_name, phone (optional)
                  </p>
                  <Button variant="outline">
                    Choose File
                  </Button>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button>Import Subscribers</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="subscriber@example.com"
                    value={newSubscriber.email}
                    onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      placeholder="John"
                      value={newSubscriber.first_name}
                      onChange={(e) => setNewSubscriber({ ...newSubscriber, first_name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      placeholder="Doe"
                      value={newSubscriber.last_name}
                      onChange={(e) => setNewSubscriber({ ...newSubscriber, last_name: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="+31 6 12345678"
                    value={newSubscriber.phone}
                    onChange={(e) => setNewSubscriber({ ...newSubscriber, phone: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSubscriber}>
                    Add Subscriber
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">{subscribers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{totalActive}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{totalInactive}</p>
              </div>
              <UserMinus className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold">+12%</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedSubscribers.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedSubscribers.length} subscriber(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  Deactivate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('add_tag')}>
                  Add Tag
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Subscriber</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSubscribers.includes(subscriber.id)}
                    onCheckedChange={(checked) => handleSelectSubscriber(subscriber.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {subscriber.first_name && subscriber.last_name 
                        ? `${subscriber.first_name} ${subscriber.last_name}`
                        : subscriber.email
                      }
                    </div>
                    {subscriber.first_name && subscriber.last_name && (
                      <div className="text-sm text-muted-foreground">{subscriber.email}</div>
                    )}
                    {subscriber.phone && (
                      <div className="text-sm text-muted-foreground">{subscriber.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                    {subscriber.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {subscriber.subscription_source.charAt(0).toUpperCase() + subscriber.subscription_source.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {subscriber.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(subscriber.subscribed_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}