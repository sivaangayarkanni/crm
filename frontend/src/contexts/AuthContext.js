import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('tenantflow_user');
    const storedToken = localStorage.getItem('tenantflow_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, tenantId) => {
    // Mock login - replace with actual API call
    const mockUser = {
      id: '1',
      email,
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      tenantId,
      avatar: null,
      permissions: ['read', 'write', 'delete']
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    localStorage.setItem('tenantflow_user', JSON.stringify(mockUser));
    localStorage.setItem('tenantflow_token', mockToken);
    
    setUser(mockUser);
    return { success: true, user: mockUser, token: mockToken };
  };

  const register = async (userData, tenantId) => {
    // Mock registration
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      tenantId,
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    localStorage.setItem('tenantflow_user', JSON.stringify(newUser));
    localStorage.setItem('tenantflow_token', mockToken);
    
    setUser(newUser);
    return { success: true, user: newUser, token: mockToken };
  };

  const logout = () => {
    localStorage.removeItem('tenantflow_user');
    localStorage.removeItem('tenantflow_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};