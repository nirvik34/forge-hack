import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Re-run icons when component updates or open state changes
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [isOpen]);

    // Keyboard shortcut / listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if / was pressed and user is not typing in a text field
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Available searchable items
    const searchableItems = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            subtitle: 'Overview of cognitive repos & active streams',
            icon: 'layout',
            path: '/dashboard'
        },
        {
            id: 'repo',
            title: 'financial-research-agent',
            subtitle: 'ai-org / financial-research-agent repository',
            icon: 'book',
            path: '/repo'
        },
        {
            id: 'agents',
            title: 'Agents Console',
            subtitle: 'Manage and trigger autonomous coder agents',
            icon: 'cpu',
            path: '/dashboard'
        },
        {
            id: 'watchdog',
            title: 'Watchdog System',
            subtitle: 'Monitor agent state and view rollback logs',
            icon: 'shield',
            path: '/dashboard'
        },
        {
            id: 'analytics',
            title: 'Analytics Dashboard',
            subtitle: 'Token usage, cost logs and efficiency metrics',
            icon: 'activity',
            path: '/dashboard'
        }
    ];

    // Filter items based on query
    const filteredItems = searchQuery.trim() === ''
        ? searchableItems
        : searchableItems.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
          );

    // Keyboard navigation inside dropdown
    const handleInputKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[activeIndex]) {
                handleItemSelect(filteredItems[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            inputRef.current?.blur();
            setIsOpen(false);
        }
    };

    const handleItemSelect = (item) => {
        navigate(item.path);
        setIsOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
    };

    return (
        <nav className="bg-gray-50 dark:bg-[#010409] border-b border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-white py-3 px-4 flex items-center justify-between text-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="w-8 h-8 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-[#30363d] transition">
                    <i data-lucide="git-merge" className="w-5 h-5 text-black dark:text-[#58a6ff]"></i>
                </Link>
                <div className="flex gap-4 font-semibold text-gray-900 dark:text-[#c9d1d9]">
                    <Link to="/dashboard" className="hover:text-gray-900 dark:text-white transition">Dashboard</Link>
                    <Link to="/agents" className="hover:text-gray-900 dark:text-white transition">Agents</Link>
                    <Link to="/watchdog" className="hover:text-gray-900 dark:text-white transition">Watchdog</Link>
                    <Link to="/analytics" className="hover:text-gray-900 dark:text-white transition">Analytics</Link>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Search Container */}
                <div ref={containerRef} className="relative hidden md:block z-50">
                    <i data-lucide="search" className="absolute left-2.5 top-1.5 w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Type / to search" 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleInputKeyDown}
                        className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md pl-8 pr-3 py-1 text-sm text-gray-900 dark:text-[#c9d1d9] placeholder-gray-400 dark:placeholder-[#8b949e] focus:outline-none focus:border-blue-600 dark:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] w-72 transition-all" 
                    />
                    <div className="absolute right-2 top-1.5 border border-gray-200 dark:border-[#30363d] rounded px-1.5 text-[10px] text-gray-500 dark:text-[#8b949e] font-mono leading-relaxed">/</div>

                    {/* Global Command/Search Dropdown Overlay */}
                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="p-2 border-b border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider">Search & Actions</span>
                                <span className="text-[10px] text-gray-400 dark:text-[#8b949e] flex gap-1.5">
                                    <span>↑↓ to navigate</span>
                                    <span>↵ to select</span>
                                    <span>esc to close</span>
                                </span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 dark:divide-[#30363d] p-1.5">
                                {filteredItems.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-[#8b949e] text-xs">
                                        No actions found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    filteredItems.map((item, index) => (
                                        <div 
                                            key={item.id}
                                            onClick={() => handleItemSelect(item)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={`p-2.5 rounded-md cursor-pointer flex items-start gap-3 transition-colors ${
                                                activeIndex === index 
                                                    ? 'bg-blue-50 dark:bg-[#1f293d] border-l-4 border-blue-500 dark:border-[#58a6ff]' 
                                                    : 'hover:bg-gray-50 dark:hover:bg-[#30363d]/30 border-l-4 border-transparent'
                                            }`}
                                        >
                                            <div className="mt-0.5">
                                                <i data-lucide={item.icon} className={`w-4 h-4 ${activeIndex === index ? 'text-blue-500 dark:text-[#58a6ff]' : 'text-gray-400 dark:text-[#8b949e]'}`}></i>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-center">
                                                    <span className={`font-semibold text-xs ${activeIndex === index ? 'text-blue-600 dark:text-[#58a6ff]' : 'text-gray-900 dark:text-[#c9d1d9]'}`}>
                                                        {item.title}
                                                    </span>
                                                    {activeIndex === index && (
                                                        <span className="text-[10px] bg-blue-100 dark:bg-[#21262d] text-blue-600 dark:text-[#58a6ff] px-1.5 py-0.5 rounded font-medium">Jump to</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mt-0.5 line-clamp-1">{item.subtitle}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {searchQuery.trim() !== '' && (
                                <div className="p-2 border-t border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] text-center">
                                    <button 
                                        className="text-xs font-semibold text-blue-600 dark:text-[#58a6ff] hover:underline"
                                        onClick={() => {
                                            navigate('/dashboard');
                                            setIsOpen(false);
                                        }}
                                    >
                                        Search all GitHub repositories for "{searchQuery}"
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <Link to="/notifications" className="relative text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-white transition">
                    <i data-lucide="bell" className="w-4 h-4"></i>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#58a6ff] rounded-full border-2 border-white dark:border-[#010409]"></span>
                </Link>
                <Link to="/settings" className="w-6 h-6 rounded-full border border-gray-200 dark:border-[#30363d] overflow-hidden cursor-pointer">
                    <img src="https://ui-avatars.com/api/?name=User&background=161b22&color=c9d1d9" alt="User" className="w-full h-full object-cover" />
                </Link>
            </div>
        </nav>
    );
}
