import { useOrganization } from "@/contexts/OrganizationContext";

export function useStoreDomain() {
  const { currentOrganization } = useOrganization();

  const getStoreDomain = () => {
    // If organization has a custom domain, use that
    if (currentOrganization?.domain) {
      return currentOrganization.domain;
    }
    
    // If organization has a subdomain, use subdomain.myaurelio.com
    if (currentOrganization?.subdomain) {
      return `${currentOrganization.subdomain}.myaurelio.com`;
    }
    
    // Fallback to current hostname
    return window.location.hostname;
  };

  return {
    domain: getStoreDomain(),
    protocol: window.location.protocol,
    fullUrl: `${window.location.protocol}//${getStoreDomain()}`
  };
}