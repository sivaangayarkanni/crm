// Smart Search Hook - Fuzzy matching and intelligent search
import { useState, useCallback, useMemo } from 'react';

// Fuzzy matching algorithm (simplified Levenshtein distance)
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return dp[m][n];
};

// Calculate similarity score (0-1)
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
};

export const useSmartSearch = (data, searchFields = ['name']) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [fuzzyThreshold, setFuzzyThreshold] = useState(0.3);

  const search = useMemo(() => {
    if (!query.trim()) return data;

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    const results = data.map(item => {
      let maxScore = 0;
      let matchedFields = [];

      // Check each searchable field
      searchFields.forEach(field => {
        const fieldValue = String(item[field] || '').toLowerCase();
        
        searchTerms.forEach(term => {
          // Exact match
          if (fieldValue.includes(term)) {
            maxScore = Math.max(maxScore, 1);
            matchedFields.push(field);
            return;
          }

          // Fuzzy match
          const similarity = calculateSimilarity(fieldValue, term);
          if (similarity > fuzzyThreshold) {
            maxScore = Math.max(maxScore, similarity * 0.9);
          }

          // Prefix match
          if (fieldValue.startsWith(term)) {
            maxScore = Math.max(maxScore, 0.7);
          }
        });
      });

      return { ...item, _searchScore: maxScore, _matchedFields: [...new Set(matchedFields)] };
    });

    // Filter out zero-score results
    let filtered = results.filter(item => item._searchScore > 0);

    // Apply filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        filtered = filtered.filter(item => item[field] === filterValue);
      }
    });

    // Sort results
    switch (sortBy) {
      case 'relevance':
        filtered.sort((a, b) => b._searchScore - a._searchScore);
        break;
      case 'date':
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'name':
        filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        break;
      default:
        break;
    }

    return filtered;
  }, [data, query, searchFields, filters, sortBy, fuzzyThreshold]);

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const terms = query.toLowerCase().split(' ').filter(Boolean);
    const allTerms = new Set();

    // Collect unique terms from all data
    data.forEach(item => {
      searchFields.forEach(field => {
        const value = String(item[field] || '').toLowerCase();
        value.split(' ').forEach(word => {
          if (word.length > 2) {
            terms.forEach(term => {
              if (word.includes(term) || calculateSimilarity(word, term) > 0.5) {
                allTerms.add(word);
              }
            });
          }
        });
      });
    });

    return Array.from(allTerms)
      .filter(term => !terms.includes(term))
      .slice(0, 5);
  }, [query, data, searchFields]);

  const highlightMatches = useCallback((text, highlightClass = 'bg-yellow-200') => {
    if (!query.trim() || !text) return text;

    const terms = query.toLowerCase().split(' ').filter(Boolean);
    let result = String(text);

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, `<span class="${highlightClass}">$1</span>`);
    });

    return result;
  }, [query]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    results: search,
    suggestions,
    highlightMatches,
    setFuzzyThreshold,
    fuzzyThreshold,
    totalResults: search.length,
  };
};

// Global search across multiple collections
export const useGlobalSearch = (collections) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return {};

    const searchResults = {};

    Object.entries(collections).forEach(([key, data]) => {
      const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
      
      searchResults[key] = data
        .map(item => {
          let score = 0;
          Object.values(item).forEach(value => {
            const strValue = String(value).toLowerCase();
            searchTerms.forEach(term => {
              if (strValue.includes(term)) score += 1;
              else if (calculateSimilarity(strValue, term) > 0.6) score += 0.5;
            });
          });
          return { ...item, _searchScore: score };
        })
        .filter(item => item._searchScore > 0)
        .sort((a, b) => b._searchScore - a._searchScore);
    });

    return searchResults;
  }, [query, collections]);

  const totalCount = useMemo(() => {
    return Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  }, [results]);

  return {
    query,
    setQuery,
    results,
    totalCount,
  };
};
