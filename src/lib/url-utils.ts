/**
 * Utility functions for URL generation based on subdomain context
 */

/**
 * Detects if the current hostname is a subdomain of myaurelio.com
 * @returns true if on a subdomain (e.g., aurelioliving.myaurelio.com), false otherwise
 */
export function isOnSubdomain(): boolean {
  const hostname = window.location.hostname;
  return hostname.endsWith('.myaurelio.com') && hostname !== 'myaurelio.com';
}

/**
 * Generates a store-aware URL path
 * @param path The base path (e.g., '/products/slug' or '/collections/slug')
 * @param storeSlug The store slug
 * @returns The full path with or without store prefix based on subdomain context
 */
export function getStoreAwarePath(path: string, storeSlug?: string): string {
  // If we're on a subdomain, don't include the /store/slug prefix
  if (isOnSubdomain()) {
    return path;
  }
  
  // If we're on the main domain and have a store slug, include the prefix
  if (storeSlug) {
    return `/store/${storeSlug}${path}`;
  }
  
  // Fallback to the path as-is
  return path;
}