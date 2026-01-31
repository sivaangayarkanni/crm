import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { TenantProvider } from './contexts/TenantContext';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import TenantResolver from './components/Tenant/TenantResolver';

// Pages
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import TenantSetup from './pages/Tenant/TenantSetup';
import Dashboard from './pages/Dashboard/Dashboard';
import Leads from './pages/Leads/Leads';
import Contacts from './pages/Contacts/Contacts';
import Deals from './pages/Deals/Deals';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Billing from './pages/Billing/Billing';

// Styles
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <TenantProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <TenantResolver />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/setup" element={<TenantSetup />} />

                {/* Protected Routes */}
                <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/app/dashboard" />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="deals" element={<Deals />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="billing" element={<Billing />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#2D3748',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </TenantProvider>
    </Provider>
  );
}

export default App;