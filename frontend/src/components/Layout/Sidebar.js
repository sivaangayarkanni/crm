import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: '🏠' },
    { name: 'Leads', href: '/app/leads', icon: '👥' },
    { name: 'Contacts', href: '/app/contacts', icon: '📞' },
    { name: 'Deals', href: '/app/deals', icon: '💼' },
    { name: 'Analytics', href: '/app/analytics', icon: '📊' },
    { name: 'Settings', href: '/app/settings', icon: '⚙️' },
    { name: 'Billing', href: '/app/billing', icon: '💳' },
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 40 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 40 } }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {/* Welcome Message */}
            <div className="flex items-center flex-shrink-0 px-4 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] flex items-center justify-center text-white font-bold">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-bold text-gray-900" style={{fontFamily: 'Poppins, sans-serif'}}>Welcome</h2>
                <p className="text-sm text-[#FF6B6B] font-semibold">{user.username || 'User'}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Info */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p>Role: {user.role?.toUpperCase() || 'USER'}</p>
                <p>Version: 1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200"
        style={{fontFamily: 'Inter, system-ui, sans-serif'}}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] flex items-center justify-center text-white font-bold">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900" style={{fontFamily: 'Poppins, sans-serif'}}>Welcome {user.username}</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;