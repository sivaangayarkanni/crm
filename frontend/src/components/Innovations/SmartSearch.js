// Smart Search - Fuzzy search with intelligent suggestions
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartSearch } from '../../hooks/useSmartSearch';

const SmartSearch = ({ 
  data, 
  searchFields = ['name', 'email'], 
  placeholder = 'Search...',
  onResultClick,
  className = '',
  showSuggestions = true,
}) => {
  const {
    query,
    setQuery,
    results,
    suggestions,
    highlightMatches,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    totalResults,
  } = useSmartSearch(data, searchFields);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        e.preventDefault();
        break;
      case 'Enter':
        if (selectedIndex >= 0 && results[selectedIndex]) {
          onResultClick?.(results[selectedIndex]);
          setIsOpen(false);
          setQuery('');
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all"
        />
        
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}

        {/* Fuzzy match indicator */}
        {query && results.length > 0 && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {totalResults} results
            </span>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && !query && (
              <div className="p-2 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1 px-2">Suggestions</p>
                <div className="flex flex-wrap gap-1">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(suggestion)}
                      className="text-xs bg-gray-100 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] px-2 py-1 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((item, index) => (
                  <motion.button
                    key={item.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      onResultClick?.(item);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      selectedIndex === index ? 'bg-[#FF6B6B]/5' : ''
                    }`}
                  >
                    {/* Result icon based on type */}
                    <span className="text-xl">
                      {item.email ? '👤' : item.value ? '💼' : '📄'}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium text-[#2D3748] truncate"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(item.name || item.title || JSON.stringify(item))
                        }}
                      />
                      {item.email && (
                        <p 
                          className="text-sm text-gray-500 truncate"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatches(item.email)
                          }}
                        />
                      )}
                      {item.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === 'qualified' ? 'bg-green-100 text-green-700' :
                          item.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>

                    {/* Relevance score */}
                    {item._searchScore && (
                      <span className="text-xs text-gray-400">
                        {Math.round(item._searchScore * 100)}% match
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <span className="text-4xl mb-2 block">🔍</span>
                <p className="text-gray-500">No results found for "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
              </div>
            )}

            {/* Footer with sort options */}
            <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs bg-white border border-gray-200 rounded px-2 py-1"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                </select>
              </div>
              
              <span className="text-xs text-gray-400">
                Press ↵ to select
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartSearch;
