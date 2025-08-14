import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Search } from "lucide-react";

interface SEOPreviewProps {
  title?: string;
  description?: string;
  slug?: string;
  type?: "product" | "collection";
}

export function SEOPreview({ title, description, slug, type = "product" }: SEOPreviewProps) {
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}/${type === "product" ? "products" : "collections"}/${slug || "example-slug"}`;
  
  // Truncate title to Google's limit (~60 characters)
  const truncatedTitle = title && title.length > 60 
    ? `${title.substring(0, 57)}...` 
    : title || `Example ${type} title`;
    
  // Truncate description to Google's limit (~160 characters)
  const truncatedDescription = description && description.length > 160 
    ? `${description.substring(0, 157)}...` 
    : description || `This is an example ${type} description that shows how it would appear in Google search results.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Preview
          <Badge variant="secondary">Google Search</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Google Search Result Preview */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="space-y-1">
              {/* URL */}
              <div className="flex items-center gap-1 text-sm text-green-700">
                <Globe className="h-3 w-3" />
                <span className="truncate">{fullUrl}</span>
              </div>
              
              {/* Title */}
              <h3 className="text-xl text-blue-600 hover:underline cursor-pointer line-clamp-1">
                {truncatedTitle}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {truncatedDescription}
              </p>
            </div>
          </div>
          
          {/* Character Counts */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Title: </span>
              <span className={title && title.length > 60 ? "text-red-500" : "text-green-600"}>
                {title?.length || 0}/60
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Description: </span>
              <span className={description && description.length > 160 ? "text-red-500" : "text-green-600"}>
                {description?.length || 0}/160
              </span>
            </div>
          </div>
          
          {/* Warnings */}
          {(title && title.length > 60) && (
            <p className="text-sm text-red-500">⚠️ Title is too long and will be truncated</p>
          )}
          {(description && description.length > 160) && (
            <p className="text-sm text-red-500">⚠️ Description is too long and will be truncated</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}