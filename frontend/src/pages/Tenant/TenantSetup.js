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

export default TenantSetup;