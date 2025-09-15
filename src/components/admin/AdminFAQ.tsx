import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FAQ_CATEGORIES = [
  'general',
  'bestellen',
  'verzending',
  'betaling',
  'retour',
  'account'
];

export function AdminFAQ() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    is_active: true
  });

  // Fetch FAQs
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FAQ[];
    },
    enabled: !!currentOrganization?.id
  });

  // Create FAQ mutation
  const createFAQMutation = useMutation({
    mutationFn: async (newFAQ: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('faqs')
        .insert([{
          ...newFAQ,
          organization_id: currentOrganization!.id,
          sort_order: (faqs?.length || 0) + 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: 'FAQ succesvol toegevoegd' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Fout bij toevoegen FAQ', variant: 'destructive' });
    }
  });

  // Update FAQ mutation
  const updateFAQMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FAQ> & { id: string }) => {
      const { data, error } = await supabase
        .from('faqs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: 'FAQ succesvol bijgewerkt' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Fout bij bijwerken FAQ', variant: 'destructive' });
    }
  });

  // Delete FAQ mutation
  const deleteFAQMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: 'FAQ succesvol verwijderd' });
    },
    onError: () => {
      toast({ title: 'Fout bij verwijderen FAQ', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingFAQ) {
      updateFAQMutation.mutate({
        id: editingFAQ.id,
        ...formData
      });
    } else {
      createFAQMutation.mutate(formData as any);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_active: faq.is_active
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      is_active: true
    });
  };

  const toggleFAQStatus = (faq: FAQ) => {
    updateFAQMutation.mutate({
      id: faq.id,
      is_active: !faq.is_active
    });
  };

  const filteredFAQs = faqs?.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!currentOrganization) {
    return <div>Geen organisatie geselecteerd</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ Beheer</h1>
          <p className="text-muted-foreground">
            Beheer veelgestelde vragen voor uw klanten
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              FAQ Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFAQ ? 'FAQ Bewerken' : 'Nieuwe FAQ'}
              </DialogTitle>
              <DialogDescription>
                {editingFAQ ? 'Wijzig de FAQ gegevens' : 'Voeg een nieuwe veelgestelde vraag toe'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Vraag</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Voer de vraag in..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="answer">Antwoord</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Voer het antwoord in..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAQ_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Actief</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createFAQMutation.isPending || updateFAQMutation.isPending}>
                  {editingFAQ ? 'Bijwerken' : 'Toevoegen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek in FAQ's..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {FAQ_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p>Laden...</p>
            </CardContent>
          </Card>
        ) : filteredFAQs && filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      <Badge variant={faq.is_active ? 'default' : 'secondary'}>
                        {faq.is_active ? 'Actief' : 'Inactief'}
                      </Badge>
                      <Badge variant="outline">
                        {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFAQStatus(faq)}
                    >
                      {faq.is_active ? 'Deactiveren' : 'Activeren'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(faq)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFAQMutation.mutate(faq.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Geen FAQ's gevonden.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}