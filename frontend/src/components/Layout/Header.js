import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Header = ({ setSidebarOpen }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [notifications] = useState([
    { id: 1, message: 'New lead assigned', time: '2m ago' },
    { id: 2, message: 'Deal closed successfully', time: '1h ago' }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4ECDC4] lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        ☰
      </button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <span className="h-5 w-5 text-gray-400 ml-3">🔍</span>
              </div>
              <input
                className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm bg-gray-50 rounded-lg"
                placeholder="Search leads, contacts, deals..."
                type="search"
                style={{fontFamily: 'Inter, sans-serif'}}
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <div className="hidden md:flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFE66D] to-[#4ECDC4] text-[#2D3748]">
            ⭐ {user.role?.toUpperCase() || 'USER'}
          </div>

          <Menu as="div" className="relative">
            <Menu.Button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ECDC4] relative">
              <span className="text-xl">🔔</span>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {notifications.length}
                  </span>
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900" style={{fontFamily: 'Poppins, sans-serif'}}>Notifications</h3>
                </div>
                {notifications.map((notification) => (
                  <Menu.Item key={notification.id}>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          <Menu as="div" className="relative">
            <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ECDC4]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="ml-3 hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins, sans-serif'}}>
                  {user.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role || 'user'}</p>
              </div>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/app/settings"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      👤 Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/app/settings"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      ⚙️ Settings
                    </a>
                  )}
                </Menu.Item>
                <div className="border-t border-gray-100"></div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full text-left px-4 py-2 text-sm text-gray-700`}
                    >
                      🚪 Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;