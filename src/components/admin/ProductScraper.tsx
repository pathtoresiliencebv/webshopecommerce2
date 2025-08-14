import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductScraperProps {
  open: boolean;
  onClose: () => void;
  onProductScraped: (productData: any) => void;
}

export function ProductScraper({ open, onClose, onProductScraped }: ProductScraperProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Product scraped successfully!",
        });
        onProductScraped(data.product);
        onClose();
        setUrl("");
      } else {
        throw new Error(data.error || "Failed to scrape product");
      }
    } catch (error: any) {
      console.error('Scraping error:', error);
      toast({
        title: "Scraping Failed",
        description: error.message || "Could not scrape product from this URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scrape Product
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product-page"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleScrape} disabled={isLoading || !url.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scrape Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}