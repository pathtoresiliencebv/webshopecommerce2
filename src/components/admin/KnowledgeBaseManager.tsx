import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  TrendingUp,
  Filter,
  Save,
  X
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  effectiveness_score: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const KnowledgeBaseManager: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const categories = ['general', 'shipping', 'returns', 'products', 'billing', 'technical'];

  useEffect(() => {
    if (currentOrganization) {
      loadKnowledgeBase();
    }
  }, [currentOrganization]);

  const loadKnowledgeBase = async () => {
    if (!currentOrganization?.id) return;

    const { data, error } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
      .order('effectiveness_score', { ascending: false });

    if (error) {
      console.error('Error loading knowledge base:', error);
      return;
    }

    setEntries((data || []) as KnowledgeEntry[]);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    try {
      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('ai_knowledge_base')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: tagsArray,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Knowledge entry updated successfully"
        });
      } else {
        // Create new entry
        const { error } = await supabase
          .from('ai_knowledge_base')
          .insert({
            organization_id: currentOrganization?.id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: tagsArray,
            effectiveness_score: 0,
            usage_count: 0,
            is_active: true
          });

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Knowledge entry created successfully"
        });
      }

      setFormData({ title: '', content: '', category: 'general', tags: '' });
      setEditingEntry(null);
      setIsCreating(false);
      loadKnowledgeBase();

    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save knowledge entry",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags.join(', ')
    });
    setIsCreating(true);
  };

  const handleDelete = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Knowledge entry deleted successfully"
      });

      loadKnowledgeBase();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge entry",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (entry: KnowledgeEntry) => {
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .update({ is_active: !entry.is_active })
        .eq('id', entry.id);

      if (error) throw error;

      loadKnowledgeBase();
      
      toast({
        title: "Success",
        description: `Knowledge entry ${entry.is_active ? 'deactivated' : 'activated'}`
      });
    } catch (error: any) {
      console.error('Error toggling entry:', error);
      toast({
        title: "Error",
        description: "Failed to update knowledge entry",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingEntry(null);
    setFormData({ title: '', content: '', category: 'general', tags: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Knowledge Base Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage AI knowledge base entries for better customer support
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingEntry ? 'Edit' : 'Create'} Knowledge Entry</span>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter knowledge entry title..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md bg-background mt-1"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter detailed knowledge content..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingEntry ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Entries */}
      <div className="grid gap-4">
        {filteredEntries.map(entry => (
          <Card key={entry.id} className={!entry.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{entry.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{entry.category}</Badge>
                    {entry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant={entry.is_active ? 'default' : 'destructive'}>
                      {entry.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Score: {entry.effectiveness_score.toFixed(1)}
                    </div>
                    <div>Used: {entry.usage_count} times</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(entry)}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {entry.content.substring(0, 200)}
                {entry.content.length > 200 && '...'}
              </p>
            </CardContent>
          </Card>
        ))}

        {filteredEntries.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory 
                  ? 'No knowledge entries found matching your filters'
                  : 'No knowledge entries found. Create your first entry to get started.'
                }
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Knowledge Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;