import React from 'react';
import { motion } from 'framer-motion';

const TenantSetup = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Your Workspace</h1>
      <p className="text-gray-600">Configure your CRM settings and preferences.</p>
    </div>
  </motion.div>
);

const Leads = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
    <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-gray-600">Leads interface coming soon...</p></div>
  </motion.div>
);

const Contacts = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
    <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-gray-600">Contacts interface coming soon...</p></div>
  </motion.div>
);

const Deals = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
    <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-gray-600">Deals interface coming soon...</p></div>
  </motion.div>
);

const Analytics = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
    <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-gray-600">Analytics dashboard coming soon...</p></div>
  </motion.div>
);

const Settings = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
    <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-gray-600">Settings interface coming soon...</p></div>
  </motion.div>
);

const Billing = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
    <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-gray-600">Billing interface coming soon...</p></div>
  </motion.div>
);

export { TenantSetup, Leads, Contacts, Deals, Analytics, Settings, Billing };