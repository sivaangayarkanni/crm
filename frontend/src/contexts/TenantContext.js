import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract tenant from subdomain or path
    const detectTenant = () => {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Mock tenant detection - in real app, fetch from API
      if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
        setTenant({
          id: subdomain,
          name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1),
          subdomain: subdomain,
          theme: {
            primary: '#3B82F6',
            secondary: '#1E40AF',
            accent: '#F59E0B'
          },
          logo: null,
          features: ['leads', 'contacts', 'deals', 'analytics'],
          plan: 'pro'
        });
      } else {
        // Default tenant for localhost/demo
        setTenant({
          id: 'demo',
          name: 'Demo Company',
          subdomain: 'demo',
          theme: {
            primary: '#3B82F6',
            secondary: '#1E40AF',
            accent: '#F59E0B'
          },
          logo: null,
          features: ['leads', 'contacts', 'deals', 'analytics'],
          plan: 'pro'
        });
      }
      setLoading(false);
    };

    detectTenant();
  }, []);

  const updateTenant = (updates) => {
    setTenant(prev => ({ ...prev, ...updates }));
  };

  const value = {
    tenant,
    loading,
    updateTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};