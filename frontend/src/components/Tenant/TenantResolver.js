import { useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';

const TenantResolver = () => {
  const { tenant, loading } = useTenant();

  useEffect(() => {
    if (!loading && tenant) {
      // Apply tenant theme
      document.documentElement.style.setProperty('--primary-color', tenant.theme.primary);
      document.documentElement.style.setProperty('--secondary-color', tenant.theme.secondary);
      document.documentElement.style.setProperty('--accent-color', tenant.theme.accent);
      
      // Update page title
      document.title = `${tenant.name} - TenantFlow CRM`;
      
      // Update favicon if tenant has custom logo
      if (tenant.logo) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
          favicon.href = tenant.logo;
        }
      }
    }
  }, [tenant, loading]);

  return null;
};

export default TenantResolver;