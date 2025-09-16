import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MoreHorizontal, Copy, ExternalLink, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { SEOPreview } from "./SEOPreview";
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

interface FullPageEditorProps {
  pageId?: string | null;
  onBack: () => void;
}

export function FullPageEditor({ pageId, onBack }: FullPageEditorProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [visibility, setVisibility] = useState("visible");
  const [publishDate, setPublishDate] = useState<Date>();
  const [template, setTemplate] = useState("page");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { domain } = useStoreDomain();
  const isEditing = pageId && pageId !== 'new';

  useEffect(() => {
    if (isEditing && pageId) {
      fetchPage(pageId);
    } else {
      setLoading(false);
    }
  }, [pageId, isEditing]);

  const fetchPage = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPage(data);
      setTitle(data.title);
      setSlug(data.slug);
      setContent(data.content);
      setMetaDescription(data.meta_description || "");
      setVisibility(data.is_published ? "visible" : "hidden");
    } catch (error) {
      console.error('Error fetching page:', error);
      toast.error('Failed to load page');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title for new pages
  useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setSlug(generatedSlug);
    }
  }, [title, isEditing]);

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
        is_published: visibility === "visible",
        organization_id: currentOrganization.id,
        author_id: user.id,
      };

      if (isEditing && page) {
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

      onBack();
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

  const handleDuplicate = async () => {
    if (!page || !currentOrganization?.id || !user?.id) return;

    try {
      const { error } = await supabase
        .from('pages')
        .insert([{
          title: `${title} (Copy)`,
          slug: `${slug}-copy-${Date.now()}`,
          content,
          meta_description: metaDescription,
          is_published: false,
          organization_id: currentOrganization.id,
          author_id: user.id,
        }]);

      if (error) throw error;
      
      toast.success('Page duplicated successfully');
      onBack();
    } catch (error) {
      console.error('Error duplicating page:', error);
      toast.error('Failed to duplicate page');
    }
  };

  const handleView = () => {
    if (slug) {
      window.open(`/${slug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Pages
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">
              {title || "Untitled"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" onClick={handleView}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Column - Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <div className="min-h-[500px]">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ height: '450px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l bg-muted/50 p-6 space-y-6">
          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={visibility} onValueChange={setVisibility}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible" id="visible" />
                  <Label htmlFor="visible">Visible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden" id="hidden" />
                  <Label htmlFor="hidden">Hidden</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled">Visible on</Label>
                </div>
              </RadioGroup>
              
              {visibility === "scheduled" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {publishDate ? format(publishDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={publishDate}
                      onSelect={setPublishDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </CardContent>
          </Card>

          {/* Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">page</SelectItem>
                  <SelectItem value="article">article</SelectItem>
                  <SelectItem value="contact">contact</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Search engine listing preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Page title</Label>
                <Input
                  id="seo-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta description</Label>
                <Textarea
                  id="meta-description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Meta description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url-handle">URL handle</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                    {domain}/
                  </span>
                  <Input
                    id="url-handle"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <SEOPreview 
                title={title}
                description={metaDescription}
                slug={slug}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}