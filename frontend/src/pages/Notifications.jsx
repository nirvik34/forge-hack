import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`;

// Seed notification data (realistic notifications for a CognitionVCS platform)
const SEED_NOTIFICATIONS = [
    {
        id: 'notif-1',
        type: 'watchdog_rollback',
        title: 'Watchdog executed hard rollback: Semantic Drift exceeded 15%',
        description: 'Agent strayed from Golden Context rules. Mitigated successfully.',
        agent: 'financial-research',
        org: 'ai-org',
        icon: 'shield-alert',
        iconColor: 'text-red-500',
        badge: { text: 'HEAD~1', bgClass: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' },
        time: '2h ago',
        unread: true,
        saved: false,
        done: false,
    },
    {
        id: 'notif-2',
        type: 'merge',
        title: 'Automated merge of hypothesis branch',
        titleSuffix: '#42',
        description: 'merged 14 verified commits into main sequence.',
        agent: 'financial-research',
        org: 'ai-org',
        icon: 'git-merge',
        iconColor: 'text-purple-500',
        badge: { text: 'exp-q3-projections', bgClass: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50' },
        time: '5h ago',
        unread: true,
        saved: false,
        done: false,
    },
    {
        id: 'notif-3',
        type: 'mention',
        title: 'Human review requested on Quarantined Branch',
        titleSuffix: '#18',
        description: null,
        mentionedBy: '@aryansoy',
        mentionText: 'Hey @nirvik-dev, check out this prompt injection vector the Watchdog caught. Safe to delete?',
        agent: 'code-reviewer',
        org: 'ai-org',
        icon: 'at-sign',
        iconColor: 'text-gray-500 dark:text-[#8b949e]',
        badge: null,
        time: 'Yesterday',
        unread: true,
        saved: false,
        done: false,
    },
    {
        id: 'notif-4',
        type: 'system',
        title: 'Approaching API Token Limit',
        description: 'Your organization has consumed 80% (4M/5M) of its allocated Gemini 2.5 Flash tokens for Watchdog scans this billing cycle.',
        agent: null,
        org: 'system',
        icon: 'zap',
        iconColor: 'text-yellow-500',
        badge: null,
        time: 'May 21',
        unread: true,
        saved: false,
        done: false,
    }
];

export default function Notifications() {
    const mainRef = useRef(null);
    const staggerItemsRef = useRef([]);

    // Notification data state
    const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);

    // UI states
    const [activeView, setActiveView] = useState('inbox');
    const [filterText, setFilterText] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '' });

    // Fetch agents from backend for sidebar filter
    const { data: agentsData } = useQuery({
        queryKey: ['agents'],
        queryFn: () => fetch(`${API_BASE}/agents`).then(res => res.json())
    });

    const triggerToast = useCallback((message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    }, []);

    // Group notifications by agent/org for display
    const groupedNotifications = useMemo(() => {
        let items = notifications;

        // Apply view filter
        if (activeView === 'inbox') {
            items = items.filter(n => !n.done);
        } else if (activeView === 'saved') {
            items = items.filter(n => n.saved && !n.done);
        } else if (activeView === 'done') {
            items = items.filter(n => n.done);
        }

        // Apply text filter
        if (filterText.trim()) {
            const lower = filterText.toLowerCase();
            items = items.filter(n => {
                const searchable = [
                    n.title,
                    n.description || '',
                    n.agent || '',
                    n.titleSuffix || '',
                    n.mentionText || '',
                    n.badge?.text || ''
                ].join(' ').toLowerCase();
                return searchable.includes(lower);
            });
        }

        // Group by agent/org
        const groups = {};
        items.forEach(notif => {
            const key = notif.agent ? `${notif.org} / ${notif.agent}` : 'CognitionVCS System';
            if (!groups[key]) {
                groups[key] = {
                    label: key,
                    isSystem: !notif.agent,
                    agent: notif.agent,
                    items: []
                };
            }
            groups[key].items.push(notif);
        });

        return Object.values(groups);
    }, [notifications, activeView, filterText]);

    // Stats for sidebar
    const inboxCount = notifications.filter(n => !n.done).length;
    const agentCounts = useMemo(() => {
        const counts = {};
        notifications.filter(n => !n.done).forEach(n => {
            const key = n.agent || 'System Alerts';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [notifications]);

    // Mark single notification as done
    const markAsDone = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, done: true, unread: false } : n));
        triggerToast('Notification marked as done.');
    }, [triggerToast]);

    // Toggle saved
    const toggleSaved = useCallback((id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, saved: !n.saved } : n
        ));
        const notif = notifications.find(n => n.id === id);
        triggerToast(notif?.saved ? 'Notification unsaved.' : 'Notification saved.');
    }, [notifications, triggerToast]);

    // Mark all visible as done
    const markAllDone = useCallback(() => {
        const visibleIds = groupedNotifications.flatMap(g => g.items.map(n => n.id));
        if (visibleIds.length === 0) return;
        setNotifications(prev => prev.map(n => visibleIds.includes(n.id) ? { ...n, done: true, unread: false } : n));
        triggerToast('Visible notifications marked as done.');
    }, [groupedNotifications, triggerToast]);

    // Toggle selection
    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Select All
    useEffect(() => {
        if (selectAll) {
            const allVisibleIds = groupedNotifications.flatMap(g => g.items.map(n => n.id));
            setSelectedIds(new Set(allVisibleIds));
        } else {
            setSelectedIds(new Set());
        }
    }, [selectAll, groupedNotifications]);

    // Stagger layout helper
    const addToStagger = (el) => {
        if (el && !staggerItemsRef.current.includes(el)) {
            staggerItemsRef.current.push(el);
        }
    };

    // GSAP animations
    useGSAP(() => {
        if (staggerItemsRef.current.length > 0) {
            gsap.fromTo(staggerItemsRef.current,
                { opacity: 0, y: 15 },
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.04,
                    duration: 0.4,
                    ease: "power2.out",
                    delay: 0.05
                }
            );
        }
    }, { scope: mainRef });

    // Initialize Lucide Icons
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [notifications, activeView, filterText, toast, selectAll]);

    const totalVisibleItems = groupedNotifications.reduce((acc, g) => acc + g.items.length, 0);

    // Empty state config
    const getEmptyState = () => {
        if (activeView === 'inbox' && filterText.trim()) {
            return {
                icon: 'search',
                title: 'No results found',
                desc: `We couldn't find any notifications matching '${filterText}'`
            };
        }
        if (activeView === 'inbox') {
            return {
                icon: 'check',
                title: 'All caught up!',
                desc: 'Your AI crew is sailing smoothly with no unread cognitive alerts.'
            };
        }
        if (activeView === 'saved') {
            return {
                icon: 'bookmark',
                title: 'No saved notifications',
                desc: "You haven't bookmarked any alerts."
            };
        }
        return {
            icon: 'check-circle',
            title: 'Nothing is done yet',
            desc: 'Recently cleared notifications will appear here.'
        };
    };

    const sidebarViews = [
        { id: 'inbox', icon: 'inbox', label: 'Inbox', count: inboxCount },
        { id: 'saved', icon: 'bookmark', label: 'Saved', count: null },
        { id: 'done', icon: 'check-circle', label: 'Done', count: null }
    ];

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-[#f6f8fa] dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
            <Navbar />

            {/* Toast */}
            <div className={`fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-white text-white dark:text-gray-900 border border-slate-700 dark:border-gray-200 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 transform transition-all duration-300 text-sm font-medium ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <i data-lucide="check" className="w-5 h-5 text-emerald-400 dark:text-emerald-600"></i>
                <span>{toast.message}</span>
            </div>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">

                {/* Left Sidebar Navigation */}
                <aside ref={addToStagger} className="w-full md:w-1/4 flex flex-col gap-6">
                    {/* Primary Filters */}
                    <nav className="flex flex-col space-y-1">
                        {sidebarViews.map(view => (
                            <div
                                key={view.id}
                                onClick={() => { setActiveView(view.id); setFilterText(''); }}
                                className={`flex items-center justify-between px-3 py-1.5 text-sm rounded-md cursor-pointer transition group ${activeView === view.id
                                        ? 'font-semibold bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22]'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <i data-lucide={view.icon} className={`w-4 h-4 ${activeView === view.id ? 'text-[#0969da] dark:text-[#58a6ff]' : 'text-gray-500 dark:text-[#8b949e]'} group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors`}></i>
                                    {view.label}
                                </div>
                                {view.count !== null && view.count > 0 && (
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-[#58a6ff] text-xs px-2 py-0.5 rounded-full font-semibold">
                                        {view.count}
                                    </span>
                                )}
                            </div>
                        ))}
                    </nav>

                    <hr className="border-gray-200 dark:border-[#30363d]" />

                    {/* Filter by Agent */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wide mb-2 px-3">Filter by Agent</h3>
                        <nav className="flex flex-col space-y-1">
                            {Object.entries(agentCounts).map(([agent, count]) => {
                                const color = agent === 'System Alerts'
                                    ? null
                                    : agent === 'financial-research'
                                        ? 'bg-blue-500'
                                        : agent === 'code-reviewer'
                                            ? 'bg-purple-500'
                                            : 'bg-emerald-500';

                                return (
                                    <div
                                        key={agent}
                                        className="flex items-center justify-between px-3 py-1.5 text-sm rounded-md cursor-pointer text-gray-700 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22] transition group"
                                        onClick={() => setFilterText(agent === 'System Alerts' ? 'API Token' : agent)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {color ? (
                                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                            ) : (
                                                <i data-lucide="server" className="w-3 h-3 text-gray-500 dark:text-[#8b949e]"></i>
                                            )}
                                            <span className="truncate w-40">{agent}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-[#8b949e]">{count}</span>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Right Content Area */}
                <section ref={addToStagger} className="w-full md:w-3/4">

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-2/3">
                            {/* Select All */}
                            <label className="flex items-center cursor-pointer text-gray-700 dark:text-[#8b949e] hover:text-black dark:hover:text-white shrink-0 px-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 dark:border-[#30363d] w-4 h-4 accent-[#0969da]"
                                    checked={selectAll}
                                    onChange={(e) => setSelectAll(e.target.checked)}
                                />
                            </label>

                            {/* Real-time Text Filter */}
                            <div className="relative w-full">
                                <i data-lucide="filter" className="absolute left-2.5 top-2 w-4 h-4 text-gray-400 dark:text-[#8b949e]"></i>
                                <input
                                    type="text"
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    placeholder="Filter notifications (e.g. 'Rollback', 'Semantic', or '#42')"
                                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-700 dark:text-[#c9d1d9] placeholder-gray-500 dark:placeholder-[#8b949e] focus:outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={markAllDone}
                                className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-700 dark:text-[#c9d1d9] px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2"
                            >
                                <i data-lucide="check" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                                Mark all as done
                            </button>
                        </div>
                    </div>

                    {/* Notification Groups */}
                    {totalVisibleItems > 0 ? (
                        <div className="flex flex-col gap-4">
                            {groupedNotifications.map((group) => (
                                <div key={group.label} className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-md shadow-sm overflow-hidden">
                                    {/* Group Header */}
                                    <div className="bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#c9d1d9]">
                                            <i data-lucide={group.isSystem ? 'server' : 'bot'} className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                                            {group.isSystem ? (
                                                <span>{group.label}</span>
                                            ) : (
                                                <Link to="/watchdog" className="hover:text-[#0969da] dark:hover:text-[#58a6ff] hover:underline">{group.label}</Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notification Items */}
                                    <div className="divide-y divide-gray-200 dark:divide-[#30363d]">
                                        {group.items.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`flex p-3 hover:bg-gray-50 dark:hover:bg-[#161b22]/80 transition bg-white dark:bg-[#0d1117]/30 relative group ${notif.done ? 'opacity-50' : ''}`}
                                            >
                                                {/* Unread Indicator */}
                                                {notif.unread && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-md"></div>
                                                )}

                                                {/* Checkbox */}
                                                <div className="pt-1 px-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 dark:border-[#30363d] w-4 h-4 accent-[#0969da]"
                                                        checked={selectedIds.has(notif.id)}
                                                        onChange={() => toggleSelect(notif.id)}
                                                    />
                                                </div>

                                                {/* Icon */}
                                                <div className="pt-1 pr-3">
                                                    <i data-lucide={notif.icon} className={`w-5 h-5 ${notif.iconColor}`}></i>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-grow flex flex-col justify-center">
                                                    <div className="flex justify-between items-start">
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-gray-900 dark:text-white hover:text-[#0969da] dark:hover:text-[#58a6ff] cursor-pointer">{notif.title}</span>
                                                            {notif.titleSuffix && (
                                                                <span className="text-gray-500 dark:text-[#8b949e] ml-1">{notif.titleSuffix}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-[#8b949e] whitespace-nowrap ml-2">{notif.time}</span>
                                                    </div>

                                                    {/* Description / Mention */}
                                                    <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-1 flex items-center gap-2 flex-wrap">
                                                        {notif.badge && (
                                                            <span className={`font-mono text-[10px] border px-1.5 rounded ${notif.badge.bgClass}`}>
                                                                {notif.badge.text}
                                                            </span>
                                                        )}
                                                        {notif.description && <span>{notif.description}</span>}
                                                        {notif.mentionedBy && (
                                                            <span>
                                                                <span className="font-semibold text-gray-700 dark:text-[#c9d1d9]">{notif.mentionedBy}</span>
                                                                {' '}mentioned you: "{notif.mentionText}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                    <button
                                                        onClick={() => markAsDone(notif.id)}
                                                        className="p-1.5 text-gray-400 dark:text-[#8b949e] hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition"
                                                        title="Mark as done"
                                                    >
                                                        <i data-lucide="check" className="w-4 h-4"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleSaved(notif.id)}
                                                        className={`p-1.5 rounded transition ${notif.saved
                                                                ? 'text-blue-600 dark:text-[#58a6ff] bg-blue-50 dark:bg-blue-900/30'
                                                                : 'text-gray-400 dark:text-[#8b949e] hover:text-blue-600 dark:hover:text-[#58a6ff] hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                                            }`}
                                                        title="Save"
                                                    >
                                                        <i data-lucide="bookmark" className="w-4 h-4"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20 text-center border border-gray-200 dark:border-[#30363d] rounded-md border-dashed bg-gray-50 dark:bg-[#161b22]/30 mt-4">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-[#30363d] rounded-full flex items-center justify-center mb-4">
                                <i data-lucide={getEmptyState().icon} className="w-8 h-8 text-gray-500 dark:text-[#8b949e]"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{getEmptyState().title}</h3>
                            <p className="text-sm text-gray-500 dark:text-[#8b949e]">{getEmptyState().desc}</p>
                        </div>
                    )}

                </section>
            </main>
        </div>
    );
}
