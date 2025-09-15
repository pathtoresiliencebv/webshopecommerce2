import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Search, Image as ImageIcon, Trash2, Copy, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  alt_text?: string;
  created_at: string;
  bucket_name: string;
}

export function AdminContent() {
  const { currentOrganization } = useOrganization();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadMediaFiles();
    }
  }, [currentOrganization?.id]);

  const loadMediaFiles = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      
      // Get product images
      const { data: productImages, error: productError } = await supabase
        .from('product_images')
        .select(`
          id,
          image_url,
          alt_text,
          created_at,
          products!inner(organization_id)
        `)
        .eq('products.organization_id', currentOrganization.id);

      if (productError) throw productError;

      // Convert product images to MediaFile format
      const mediaFiles: MediaFile[] = productImages?.map(img => ({
        id: img.id,
        filename: img.image_url.split('/').pop() || 'unknown',
        file_url: img.image_url,
        file_type: 'image',
        file_size: 0, // We don't have size info for existing images
        alt_text: img.alt_text || undefined,
        created_at: img.created_at,
        bucket_name: 'product-images'
      })) || [];

      setMediaFiles(mediaFiles);
    } catch (error) {
      console.error('Error loading media files:', error);
      toast.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!currentOrganization?.id || files.length === 0) return;

    setUploading(true);
    const uploadedFiles: MediaFile[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        const newMediaFile: MediaFile = {
          id: crypto.randomUUID(),
          filename: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString(),
          bucket_name: 'product-images'
        };

        uploadedFiles.push(newMediaFile);
      }

      setMediaFiles(prev => [...uploadedFiles, ...prev]);
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file: MediaFile) => {
    try {
      // Extract file path from URL
      const urlParts = file.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from(file.bucket_name)
        .remove([fileName]);

      if (error) throw error;

      setMediaFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const filteredFiles = mediaFiles.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.alt_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Content Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Images</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your images here, or click to browse
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <Button 
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredFiles.length} image{filteredFiles.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Images Grid */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No images found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search terms' : 'Upload your first image to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedFile(file);
                    setShowPreview(true);
                  }}
                >
                  <img
                    src={file.file_url}
                    alt={file.alt_text || file.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDNIMTlWMUgxNlYzSDhWMUg1VjNIM1Y4SDEwLjVMMTMgMTBMMTYgN0wyMSAzWiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMjEgMTlIMTlWMjFIMTZWMTlIOFYyMUg1VjE5SDNWOEgxMC41TDEzIDEwTDE2IDdMMjEgMTlaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';
                    }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(file.file_url);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Filename */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2">
                    <p className="truncate">{file.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedFile?.filename}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedFile.file_url}
                  alt={selectedFile.alt_text || selectedFile.filename}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Filename:</span> {selectedFile.filename}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedFile.file_type}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {selectedFile.file_size > 0 ? `${(selectedFile.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedFile.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(selectedFile.file_url)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteFile(selectedFile);
                    setShowPreview(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}