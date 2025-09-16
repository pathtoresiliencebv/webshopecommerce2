import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useStoreDomain } from "@/hooks/useStoreDomain";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
}

interface PageEditorProps {
  page?: Page | null;
  onSave: () => void;
  onCancel: () => void;
}

export function PageEditor({ page, onSave, onCancel }: PageEditorProps) {
  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [content, setContent] = useState(page?.content || "");
  const [metaDescription, setMetaDescription] = useState(page?.meta_description || "");
  const [isPublished, setIsPublished] = useState(page?.is_published || false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { domain } = useStoreDomain();

  // Auto-generate slug from title
  useEffect(() => {
    if (!page && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setSlug(generatedSlug);
    }
  }, [title, page]);

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image',
    'align', 'color', 'background', 'blockquote', 'code-block'
  ];

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !currentOrganization?.id || !user?.id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const pageData = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        meta_description: metaDescription.trim() || null,
        is_published: isPublished,
        organization_id: currentOrganization.id,
        author_id: user.id,
      };

      if (page) {
        const { error } = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', page.id);

        if (error) throw error;
        toast.success('Page updated successfully');
      } else {
        const { error } = await supabase
          .from('pages')
          .insert([pageData]);

        if (error) throw error;
        toast.success('Page created successfully');
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving page:', error);
      if (error.code === '23505') {
        toast.error('A page with this slug already exists');
      } else {
        toast.error('Failed to save page');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={previewMode ? "outline" : "default"}
            size="sm"
            onClick={() => setPreviewMode(false)}
          >
            Edit
          </Button>
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="flex-1 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>{title || 'Untitled Page'}</CardTitle>
              {metaDescription && (
                <CardDescription>{metaDescription}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="content" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO & Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="flex-1 flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="page-url-slug"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-2">
              <Label>Content</Label>
              <div className="flex-1 min-h-0">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ height: 'calc(100% - 42px)' }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="flex-1 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search engines (recommended: 150-160 characters)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 characters
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Search Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="text-blue-600 text-sm font-medium">
                      {title || 'Untitled Page'}
                    </div>
                    <div className="text-green-700 text-xs">
                      {domain}/{slug || 'page-slug'}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {metaDescription || 'No meta description provided.'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}