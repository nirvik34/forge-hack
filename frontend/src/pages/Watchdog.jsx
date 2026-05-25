import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';

export default function Watchdog() {
    const mainRef = useRef();
    const staggerItemsRef = useRef([]);
    const queryClient = useQueryClient();

    // Accordion state
    const [openRows, setOpenRows] = useState({});

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState('All');
    const [selectedAgent, setSelectedAgent] = useState('All');

    // Rule Configuration Modal State
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [rulesList, setRulesList] = useState([]);

    // Toast/Feedback state
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Fetch watchdog logs
    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['watchdog-logs'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/scan/logs`).then(res => res.json()),
        refetchInterval: 5000 // Poll logs every 5 seconds for real-time threat feed
    });

    // Fetch agents (to populate sidebar filter dynamically)
    const { data: agentsData } = useQuery({
        queryKey: ['agents'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/agents`).then(res => res.json())
    });

    // Fetch system metrics
    const { data: metricsData } = useQuery({
        queryKey: ['metrics'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/metrics`).then(res => res.json())
    });

    // Fetch watchdog rules
    const { data: fetchedRulesData, refetch: refetchRules } = useQuery({
        queryKey: ['watchdog-rules'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/scan/rules`).then(res => res.json()),
        enabled: isRulesModalOpen // Only fetch when modal is open
    });

    // Populate rules state when fetched
    useEffect(() => {
        if (fetchedRulesData?.data) {
            setRulesList(fetchedRulesData.data);
        }
    }, [fetchedRulesData]);

    // Mutation to update rules
    const updateRulesMutation = useMutation({
        mutationFn: (rules) => {
            return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/scan/rules/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rules })
            }).then(res => res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchdog-rules'] });
            setIsRulesModalOpen(false);
            showToast("Watchdog sentinel rules updated successfully.");
        },
        onError: () => {
            showToast("Failed to update rules.");
        }
    });

    // Mutation to clear logs
    const clearLogsMutation = useMutation({
        mutationFn: () => {
            return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/scan/clear`, {
                method: 'POST'
            }).then(res => res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchdog-logs'] });
            showToast("Watchdog logs cleared successfully.");
        },
        onError: () => {
            showToast("Failed to clear logs.");
        }
    });

    const toggleRow = (id) => {
        setOpenRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

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
    }, { scope: mainRef, dependencies: [logsData, metricsData, agentsData] });

    // Initialize Lucide Icons on state changes
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [logsData, metricsData, agentsData, openRows, isRulesModalOpen, rulesList]);

    // Data parsing
    const rawLogs = logsData?.data || [];
    const rawAgents = agentsData?.data || [];
    const metrics = metricsData?.data || {
        memory_integrity: 99.4,
        active_agents: 3,
        rollbacks: 142,
        api_tokens_used: 14208
    };

    // Filter logic
    const filteredLogs = rawLogs.filter(log => {
        const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.violated_rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.commit_hash.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSeverity = selectedSeverity === 'All' || 
                            log.severity.toLowerCase() === selectedSeverity.toLowerCase();

        const matchesAgent = selectedAgent === 'All' || 
                            log.agent_name.toLowerCase() === selectedAgent.toLowerCase();

        return matchesSearch && matchesSeverity && matchesAgent;
    });

    // Count severities for sidebar
    const criticalCount = rawLogs.filter(l => l.severity === 'critical').length;
    const warningCount = rawLogs.filter(l => l.severity === 'warning').length;
    const infoCount = rawLogs.filter(l => l.severity === 'info' || l.severity === 'pass').length;

    const handleRuleToggle = (ruleId) => {
        setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    };

    const handleRuleSeverityChange = (ruleId, newSeverity) => {
        setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, severity: newSeverity } : r));
    };

    const handleSaveRules = (e) => {
        e.preventDefault();
        updateRulesMutation.mutate(rulesList);
    };

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-[#f6f8fa] dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9] transition-colors duration-200">
            {/* Reusable Navbar */}
            <Navbar />

            {/* Toast feedback */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 border border-gray-700 dark:border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <i data-lucide="info" className="w-4 h-4 text-blue-500"></i>
                    {toastMessage}
                </div>
            )}

            {/* Configure Rules Modal */}
            {isRulesModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-2xl border border-gray-200 dark:border-[#30363d] max-w-lg w-full p-6 animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-[#30363d] mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                <i data-lucide="shield" className="w-5 h-5 text-green-600"></i> Configure Watchdog Sentinels
                            </h3>
                            <button onClick={() => setIsRulesModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                                <i data-lucide="x" className="w-5 h-5"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveRules} className="space-y-4">
                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-4">
                                Define the LLM-as-a-judge security boundaries. Active sentinels inspect every cognitive commit and rollback on failures.
                            </p>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {rulesList.map((rule) => (
                                    <div key={rule.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md">
                                        <div className="flex items-start gap-2.5 max-w-[70%]">
                                            <input 
                                                type="checkbox"
                                                id={rule.id}
                                                checked={rule.enabled}
                                                onChange={() => handleRuleToggle(rule.id)}
                                                className="mt-1 cursor-pointer rounded dark:bg-[#0d1117] border-gray-300 dark:border-[#30363d] text-blue-600"
                                            />
                                            <label htmlFor={rule.id} className="text-xs font-semibold text-gray-900 dark:text-white cursor-pointer select-none">
                                                {rule.name}
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase">Action:</span>
                                            <select
                                                value={rule.severity}
                                                onChange={(e) => handleRuleSeverityChange(rule.id, e.target.value)}
                                                className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded px-1.5 py-0.5 text-xs text-gray-900 dark:text-[#c9d1d9] focus:outline-none"
                                            >
                                                <option value="critical">Rollback</option>
                                                <option value="warning">Log Warn</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-[#30363d] pt-4 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsRulesModalOpen(false)} 
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] rounded-md px-4 py-1.5 text-sm font-medium transition shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={updateRulesMutation.isPending}
                                    className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] border border-gray-300 dark:border-[rgba(240,246,252,0.1)] text-white px-4 py-1.5 text-sm font-semibold rounded-md transition shadow-sm flex items-center gap-1.5"
                                >
                                    {updateRulesMutation.isPending ? 'Saving...' : 'Save Rules'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Container */}
            <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8">
                
                {/* Page Header & Global Stats */}
                <div className="mb-6">
                    <div ref={addToStagger} className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-normal text-gray-900 dark:text-white flex items-center gap-2">
                                <i data-lucide="shield" className="w-6 h-6 text-green-600"></i> Watchdog Sentinels
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-[#8b949e] mt-1">
                                Real-time anti-virus monitoring, hallucination mitigation (HalMit), and cognitive rollbacks.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsRulesModalOpen(true)}
                            className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-4 py-1.5 rounded-md transition shadow-sm text-sm font-medium flex items-center gap-2"
                        >
                            <i data-lucide="settings" className="w-4 h-4"></i> Configure Rules
                        </button>
                    </div>

                    {/* Health KPI Cards */}
                    <div ref={addToStagger} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 dark:text-[#8b949e] mb-1">System Health</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-semibold text-green-600 dark:text-[#2ea043]">Secure</span>
                                <i data-lucide="check-circle-2" className="w-5 h-5 text-green-600 dark:text-[#2ea043]"></i>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 dark:text-[#8b949e] mb-1">Integrity Score</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white font-mono">{metrics.memory_integrity}%</div>
                        </div>
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 dark:text-[#8b949e] mb-1">Threats Mitigated</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold text-red-600 dark:text-[#ff7b72] font-mono">{metrics.rollbacks}</span>
                                <span className="text-xs text-gray-500 dark:text-[#8b949e]">Rollbacks</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 dark:text-[#8b949e] mb-1">Active Sentinels</div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-2.5 w-2.5 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                </span>
                                <span className="text-2xl font-semibold text-gray-900 dark:text-white font-mono">{metrics.active_agents}</span>
                                <span className="text-xs text-gray-500 dark:text-[#8b949e] uppercase ml-1">Nodes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Layout Split: Sidebar Filters & Main Feed */}
                <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Left Sidebar (Filters) */}
                    <div ref={addToStagger} className="w-full md:w-1/4 flex flex-col gap-6">
                        {/* Search */}
                        <div className="relative">
                            <i data-lucide="search" className="absolute left-2.5 top-2 w-4 h-4 text-gray-400 dark:text-[#8b949e]"></i>
                            <input 
                                type="text" 
                                placeholder="Search logs or hashes..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all text-gray-900 dark:text-[#c9d1d9] placeholder-gray-400 dark:placeholder-[#8b949e]"
                            />
                        </div>

                        {/* Filter Groups */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wide mb-2 px-1">Severity</h3>
                            <div className="space-y-1">
                                <div 
                                    onClick={() => setSelectedSeverity(selectedSeverity === 'All' ? 'critical' : 'All')}
                                    className={`flex justify-between items-center px-3 py-1.5 rounded-md cursor-pointer text-xs transition ${selectedSeverity === 'critical' ? 'bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22]'}`}
                                >
                                    <span className="flex items-center gap-2"><i data-lucide="alert-triangle" className="w-4 h-4 text-red-500"></i> Critical (Rollback)</span>
                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-[#ff7b72] text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">{criticalCount}</span>
                                </div>
                                <div 
                                    onClick={() => setSelectedSeverity(selectedSeverity === 'warning' ? 'All' : 'warning')}
                                    className={`flex justify-between items-center px-3 py-1.5 rounded-md cursor-pointer text-xs transition ${selectedSeverity === 'warning' ? 'bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22]'}`}
                                >
                                    <span className="flex items-center gap-2"><i data-lucide="alert-circle" className="w-4 h-4 text-orange-500"></i> Warning (Logged)</span>
                                    <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">{warningCount}</span>
                                </div>
                                <div 
                                    onClick={() => setSelectedSeverity(selectedSeverity === 'info' ? 'All' : 'info')}
                                    className={`flex justify-between items-center px-3 py-1.5 rounded-md cursor-pointer text-xs transition ${selectedSeverity === 'info' ? 'bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22]'}`}
                                >
                                    <span className="flex items-center gap-2"><i data-lucide="info" className="w-4 h-4 text-blue-500"></i> Info (Scan Pass)</span>
                                    <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">{infoCount}</span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200 dark:border-[#30363d]" />

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wide mb-2 px-1">Repository / Agent</h3>
                            <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                                <div 
                                    onClick={() => setSelectedAgent('All')}
                                    className={`px-3 py-1.5 rounded-md cursor-pointer text-xs transition truncate ${selectedAgent === 'All' ? 'bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22]'}`}
                                >
                                    All Repositories
                                </div>
                                {rawAgents.map(agent => (
                                    <div 
                                        key={agent.id}
                                        onClick={() => setSelectedAgent(agent.name)}
                                        className={`px-3 py-1.5 rounded-md cursor-pointer text-xs transition truncate ${selectedAgent === agent.name ? 'bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#161b22]'}`}
                                    >
                                        {agent.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Main Pane (Threat Feed) */}
                    <div ref={addToStagger} className="w-full md:w-3/4">
                        
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm overflow-hidden">
                            
                            {/* Feed Header */}
                            <div className="bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-4 py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="font-semibold text-gray-900 dark:text-white">{filteredLogs.length} Threats</span>
                                    <span className="text-gray-500 dark:text-[#8b949e] hidden sm:inline">intercepted and analyzed by Watchdog.</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (confirm("Are you sure you want to clear all logs?")) {
                                            clearLogsMutation.mutate();
                                        }
                                    }}
                                    className="text-xs text-gray-500 dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition font-semibold"
                                >
                                    Clear Logs
                                </button>
                            </div>

                            {/* Threat Feed Items */}
                            <div className="divide-y divide-gray-200 dark:divide-[#30363d]">
                                {logsLoading ? (
                                    <div className="py-12 text-center text-gray-500 dark:text-[#8b949e] flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Reading threat logs from database...</span>
                                    </div>
                                ) : filteredLogs.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 dark:text-[#8b949e]">
                                        <i data-lucide="shield-check" className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-[#2ea043]"></i>
                                        <p className="font-semibold text-sm">No threats found.</p>
                                        <p className="text-xs mt-1">Your code repositories are fully secured.</p>
                                    </div>
                                ) : (
                                    filteredLogs.map((log) => {
                                        const isOpen = openRows[log.id];
                                        
                                        // Dynamic color based on severity
                                        let severityIcon = <i data-lucide="alert-triangle" className="w-5 h-5 text-red-500"></i>;
                                        let badgeStyle = "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-[#ff7b72] border-red-200 dark:border-red-800/30";
                                        if (log.severity === 'warning') {
                                            severityIcon = <i data-lucide="alert-circle" className="w-5 h-5 text-orange-500"></i>;
                                            badgeStyle = "bg-orange-100 dark:bg-orange-950/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800/30";
                                        } else if (log.severity === 'info' || log.status === 'Passed') {
                                            severityIcon = <i data-lucide="info" className="w-5 h-5 text-blue-500"></i>;
                                            badgeStyle = "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/30";
                                        }

                                        return (
                                            <div key={log.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-[#161b22]/50 transition-colors duration-200">
                                                <div className="flex gap-3">
                                                    {/* Severity Icon */}
                                                    <div className="mt-1 flex-shrink-0">
                                                        {severityIcon}
                                                    </div>
                                                    {/* Content */}
                                                    <div className="w-full">
                                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm hover:underline cursor-pointer" onClick={() => toggleRow(log.id)}>
                                                                    {log.title}
                                                                </h4>
                                                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-1 flex flex-wrap items-center gap-2">
                                                                    <span className="font-mono text-gray-600 dark:text-[#8b949e] bg-gray-100 dark:bg-[#21262d] px-1 rounded border border-gray-200 dark:border-[#30363d]">
                                                                        {log.agent_name}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>Commit <span className="font-mono text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer">{log.commit_hash}</span></span>
                                                                    <span>•</span>
                                                                    <span>{log.time}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`border text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider shadow-sm ${badgeStyle}`}>
                                                                {log.status}
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-2 mb-3">
                                                            {log.description}
                                                        </p>
                                                        
                                                        {/* Toggle Details Button */}
                                                        <button 
                                                            onClick={() => toggleRow(log.id)} 
                                                            className="text-xs text-gray-500 dark:text-[#8b949e] font-semibold flex items-center gap-1 hover:text-[#0969da] dark:hover:text-[#58a6ff] transition"
                                                        >
                                                            <i 
                                                                data-lucide="chevron-down" 
                                                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                                            ></i> 
                                                            {isOpen ? 'Hide Overseer Trace' : 'View Overseer Trace'}
                                                        </button>

                                                        {/* Expandable Details Accordion */}
                                                        <div 
                                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                                                        >
                                                            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 text-slate-300 font-mono text-xs shadow-inner">
                                                                <div className="text-emerald-400 mb-2 border-b border-slate-700 pb-1 uppercase tracking-wider font-bold flex items-center gap-1">
                                                                    <i data-lucide="shield-check" className="w-4 h-4"></i> Watchdog Sentinel Evaluation
                                                                </div>
                                                                <p className="mb-1">
                                                                    <span className="text-blue-400">Rule Violated:</span> {log.violated_rule}
                                                                </p>
                                                                <p className="mb-4 whitespace-pre-wrap leading-relaxed">
                                                                    <span className="text-blue-400">Overseer Verdict:</span> {log.overseer_verdict}
                                                                </p>
                                                                
                                                                <div className="text-red-400 mb-2 border-b border-slate-700 pb-1 mt-4 uppercase tracking-wider font-bold flex items-center gap-1">
                                                                    <i data-lucide="file-code" className="w-4 h-4"></i> Rejected Payload / Context
                                                                </div>
                                                                <pre className="bg-[#161b22] text-slate-100 p-3 rounded border border-[#30363d] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                                    <code>{log.payload}</code>
                                                                </pre>

                                                                <div className="mt-4 text-emerald-400 border-t border-slate-700 pt-2 flex flex-col gap-1">
                                                                    <div className="font-semibold">Rollback/Remediation Sequence:</div>
                                                                    <pre className="text-emerald-500 whitespace-pre">{log.rollback_cmd}</pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
