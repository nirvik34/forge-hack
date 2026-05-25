import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';

export default function Agents() {
    const mainRef = useRef();
    const staggerItemsRef = useRef([]);
    const queryClient = useQueryClient();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [environment, setEnvironment] = useState('cloud');
    const [watchdogSecurity, setWatchdogSecurity] = useState('strict');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedEnv, setSelectedEnv] = useState('All');
    const [sortBy, setSortBy] = useState('Last updated');

    // Dropdown open states
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isEnvOpen, setIsEnvOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Dynamic lists & click outside refs
    const typeDropdownRef = useRef();
    const envDropdownRef = useRef();
    const sortDropdownRef = useRef();

    // Toast/Feedback state
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
                setIsTypeOpen(false);
            }
            if (envDropdownRef.current && !envDropdownRef.current.contains(e.target)) {
                setIsEnvOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch agents from backend
    const { data: agentsData, isLoading: agentsLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: () => fetch('http://localhost:8000/agents').then(res => res.json())
    });

    const rawAgents = agentsData?.data || [];

    // Enrich agent helper to support mockups & database consistency
    const enrichAgent = (agent) => {
        const defaultData = {
            language: agent.name.includes("rust") || agent.name.includes("ops") ? "Rust" : 
                      (agent.name.includes("js") || agent.name.includes("crypto") || agent.name.includes("market") ? "JavaScript" : "Python"),
            branch: agent.name.includes("ops") ? "fix-deployment-bug" :
                    agent.name.includes("crypto") || agent.name.includes("market") ? "exp-hyperparameter-tune" : "main",
            commits: agent.name.includes("crypto") || agent.name.includes("market") ? 54190 :
                     agent.name.includes("research") ? 12402 :
                     agent.name.includes("ops") ? 8931 : 1024,
            visibility: agent.name.includes("research") ? "Public" : "Private",
            watchdog: agent.status === "Sleeping" ? "Sleeping" :
                      agent.name.includes("ops") ? "Hallucination Blocked" : "Clear",
            environment: agent.type === "Cloud Agent" || agent.type === "Cloud IDE Integration" ? "Cloud" : "Local",
        };
        return { ...defaultData, ...agent };
    };

    const enrichedAgents = rawAgents.map(enrichAgent);

    // Create Agent Mutation
    const createAgentMutation = useMutation({
        mutationFn: (newAgent) => {
            return fetch('http://localhost:8000/agents/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-secure-api-key'
                },
                body: JSON.stringify(newAgent),
            }).then(res => res.json());
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            setIsModalOpen(false);
            setNewAgentName('');
            setSystemPrompt('');
            setEnvironment('cloud');
            setWatchdogSecurity('strict');
            showToast(`Successfully initialized cognitive repository: ${data.data.name}`);
        },
        onError: () => {
            showToast("Failed to create agent repository.");
        }
    });

    const handleCreateAgent = (e) => {
        e.preventDefault();
        if (!newAgentName.trim()) return;

        createAgentMutation.mutate({
            org: 'ai-org',
            name: newAgentName.toLowerCase().replace(/\s+/g, '-'),
            description: systemPrompt || 'Autonomous agent repository.'
        });
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
    }, { scope: mainRef, dependencies: [enrichedAgents.length] });

    // Initialize Lucide Icons on render
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [enrichedAgents, isModalOpen, isTypeOpen, isEnvOpen, isSortOpen]);

    // Filtering logic
    const filteredAgents = enrichedAgents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              agent.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = selectedType === 'All' || 
                            (selectedType === 'Cloud' && agent.environment === 'Cloud') ||
                            (selectedType === 'Local' && agent.environment === 'Local') ||
                            (selectedType === 'IDE' && agent.type && agent.type.includes('IDE')) ||
                            (selectedType === 'CLI' && agent.type && agent.type.includes('CLI'));

        const matchesEnv = selectedEnv === 'All' || 
                           (selectedEnv === 'Cloud' && agent.environment === 'Cloud') ||
                           (selectedEnv === 'Local' && agent.environment === 'Local');

        return matchesSearch && matchesType && matchesEnv;
    });

    // Sorting logic
    const sortedAgents = [...filteredAgents].sort((a, b) => {
        if (sortBy === 'Name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'Commits') {
            return b.commits - a.commits;
        } else {
            // Default "Last updated" / status priority
            return a.status === 'Active' ? -1 : 1;
        }
    });

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9] transition-colors duration-200">
            {/* Reusable Navbar */}
            <Navbar />

            {/* Toast feedback */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 border border-gray-700 dark:border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <i data-lucide="info" className="w-4 h-4 text-blue-500"></i>
                    {toastMessage}
                </div>
            )}

            {/* New Agent Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-2xl border border-gray-200 dark:border-[#30363d] max-w-lg w-full p-6 animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-[#30363d] mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                <i data-lucide="bot" className="w-5 h-5 text-gray-500 dark:text-gray-400"></i> Initialize New Agent
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateAgent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    Agent Repository Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    value={newAgentName}
                                    onChange={(e) => setNewAgentName(e.target.value)}
                                    placeholder="e.g., automated-code-reviewer" 
                                    className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-[#c9d1d9] focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all font-mono"
                                />
                                <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Great repository names are short and memorable.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">System Prompt / Identity</label>
                                <textarea 
                                    rows="3" 
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-[#c9d1d9] focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all"
                                    placeholder="You are an expert Python developer tasked with reviewing pull requests..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-[#30363d] pt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Environment</label>
                                    <select 
                                        value={environment}
                                        onChange={(e) => setEnvironment(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-[#c9d1d9] focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all cursor-pointer"
                                    >
                                        <option value="cloud">Cloud (Supabase/Managed)</option>
                                        <option value="local">Local (DiffMem / Mounted)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Watchdog Security</label>
                                    <select 
                                        value={watchdogSecurity}
                                        onChange={(e) => setWatchdogSecurity(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-[#c9d1d9] focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all cursor-pointer"
                                    >
                                        <option value="strict">Strict (Halt on Hallucination)</option>
                                        <option value="warn">Warn Only (Log but continue)</option>
                                        <option value="off">Off (Raw execution)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-[#30363d] pt-4 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)} 
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] rounded-md px-4 py-1.5 text-sm font-medium transition shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createAgentMutation.isPending || !newAgentName.trim()}
                                    className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-[rgba(240,246,252,0.1)] text-white px-4 py-1.5 text-sm font-semibold rounded-md transition shadow-sm flex items-center gap-1.5"
                                >
                                    <i data-lucide="git-commit" className="w-4 h-4"></i> 
                                    {createAgentMutation.isPending ? 'Creating...' : 'Create repository'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Container */}
            <main className="flex-grow w-full max-w-[1024px] mx-auto px-4 md:px-8 py-8">
                
                {/* User Profile Header Summary */}
                <div ref={addToStagger} className="flex items-end justify-between border-b border-gray-200 dark:border-[#30363d] pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://ui-avatars.com/api/?name=Nirvik+Dev&background=0D8ABC&color=fff&size=80" 
                            alt="Profile" 
                            className="w-16 h-16 rounded-full border border-gray-200 dark:border-[#30363d] shadow-sm"
                        />
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight">Nirvik Dev</h1>
                            <p className="text-sm text-gray-500 dark:text-[#8b949e]">
                                {agentsLoading ? "Loading autonomous agents..." : `Managing ${rawAgents.length} Autonomous Agents`}
                            </p>
                        </div>
                    </div>
                    {/* Main Action Button */}
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] border border-gray-300 dark:border-[rgba(240,246,252,0.1)] text-white px-4 py-1.5 text-sm font-semibold rounded-md transition shadow-sm flex items-center gap-2"
                    >
                        <i data-lucide="book-plus" className="w-4 h-4"></i> New Agent
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div ref={addToStagger} className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-grow">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find an agent repository..." 
                            className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all text-gray-900 dark:text-[#c9d1d9] placeholder-gray-400 dark:placeholder-[#8b949e]"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Type Filter */}
                        <div className="relative" ref={typeDropdownRef}>
                            <button 
                                onClick={() => setIsTypeOpen(!isTypeOpen)}
                                className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm font-medium transition shadow-sm flex items-center gap-2"
                            >
                                Type: <span className="font-semibold">{selectedType}</span> 
                                <i data-lucide="chevron-down" className="w-3.5 h-3.5"></i>
                            </button>
                            {isTypeOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-md shadow-lg z-20 overflow-hidden">
                                    <div className="py-1">
                                        {['All', 'Cloud', 'Local', 'IDE', 'CLI'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setSelectedType(type);
                                                    setIsTypeOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[#30363d] ${selectedType === type ? 'font-bold text-blue-600 dark:text-[#58a6ff]' : 'text-gray-700 dark:text-[#c9d1d9]'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Environment Filter */}
                        <div className="relative" ref={envDropdownRef}>
                            <button 
                                onClick={() => setIsEnvOpen(!isEnvOpen)}
                                className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm font-medium transition shadow-sm flex items-center gap-2"
                            >
                                Environment: <span className="font-semibold">{selectedEnv}</span> 
                                <i data-lucide="chevron-down" className="w-3.5 h-3.5"></i>
                            </button>
                            {isEnvOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-md shadow-lg z-20 overflow-hidden">
                                    <div className="py-1">
                                        {['All', 'Cloud', 'Local'].map((env) => (
                                            <button
                                                key={env}
                                                onClick={() => {
                                                    setSelectedEnv(env);
                                                    setIsEnvOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[#30363d] ${selectedEnv === env ? 'font-bold text-blue-600 dark:text-[#58a6ff]' : 'text-gray-700 dark:text-[#c9d1d9]'}`}
                                            >
                                                {env}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative" ref={sortDropdownRef}>
                            <button 
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm font-medium transition shadow-sm flex items-center gap-2"
                            >
                                Sort: <span className="font-semibold">{sortBy}</span> 
                                <i data-lucide="chevron-down" className="w-3.5 h-3.5"></i>
                            </button>
                            {isSortOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-md shadow-lg z-20 overflow-hidden">
                                    <div className="py-1">
                                        {['Last updated', 'Commits', 'Name'].map((sort) => (
                                            <button
                                                key={sort}
                                                onClick={() => {
                                                    setSortBy(sort);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[#30363d] ${sortBy === sort ? 'font-bold text-blue-600 dark:text-[#58a6ff]' : 'text-gray-700 dark:text-[#c9d1d9]'}`}
                                            >
                                                {sort}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Agent Repository List */}
                <div id="agent-list" className="border-t border-gray-200 dark:border-[#30363d] border-b mb-12 divide-y divide-gray-200 dark:divide-[#30363d]">
                    {agentsLoading ? (
                        <div className="py-12 text-center text-gray-500 dark:text-[#8b949e] flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Scanning cognitive environments...</span>
                        </div>
                    ) : sortedAgents.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-[#8b949e]">
                            <i data-lucide="search" className="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
                            <p className="font-semibold text-sm">No agents match your filter criteria.</p>
                            <p className="text-xs mt-1">Try resetting search query or dropdowns.</p>
                        </div>
                    ) : (
                        sortedAgents.map((agent) => {
                            // Define language dot color
                            const langColor = agent.language === 'Rust' ? 'bg-[#dea584]' : 
                                              agent.language === 'JavaScript' ? 'bg-[#f1e05a]' : 'bg-[#3572A5]';

                            // Determine status action buttons
                            let actionButton = null;
                            if (agent.watchdog === 'Hallucination Blocked') {
                                actionButton = (
                                    <button 
                                        onClick={() => showToast(`Initiated rollback sequence for ${agent.name}...`)}
                                        className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <i data-lucide="rotate-ccw" className="w-3.5 h-3.5 text-red-500"></i> Rollback
                                    </button>
                                );
                            } else if (agent.watchdog === 'Sleeping') {
                                actionButton = (
                                    <button 
                                        onClick={() => showToast(`Waking up ${agent.name} agent...`)}
                                        className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <i data-lucide="play" className="w-3.5 h-3.5 text-green-500"></i> Wake Agent
                                    </button>
                                );
                            } else if (agent.branch === 'exp-hyperparameter-tune') {
                                actionButton = (
                                    <button 
                                        onClick={() => showToast(`Proposing merge for branch ${agent.branch}...`)}
                                        className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <i data-lucide="git-merge" className="w-3.5 h-3.5 text-purple-500"></i> Propose Merge
                                    </button>
                                );
                            } else {
                                actionButton = (
                                    <Link 
                                        to="/repo" 
                                        state={{ agent }}
                                        className="bg-gray-50 hover:bg-gray-100 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <i data-lucide="activity" className="w-3.5 h-3.5 text-gray-400"></i> View Tree
                                    </Link>
                                );
                            }

                            // Watchdog badge styling
                            let watchdogBadge = null;
                            if (agent.watchdog === 'Clear') {
                                watchdogBadge = (
                                    <span className="bg-green-50 dark:bg-[#dafbe1]/10 text-green-600 dark:text-[#3fb950] border border-green-200 dark:border-green-800/30 rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                                        <i data-lucide="shield-check" className="w-3 h-3"></i> Watchdog: Clear
                                    </span>
                                );
                            } else if (agent.watchdog === 'Hallucination Blocked') {
                                watchdogBadge = (
                                    <span className="bg-red-50 dark:bg-[#ffebe9]/10 text-red-600 dark:text-[#ff7b72] border border-red-200 dark:border-red-800/30 rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                                        <i data-lucide="shield-alert" className="w-3 h-3"></i> Watchdog: Blocked
                                    </span>
                                );
                            } else {
                                watchdogBadge = (
                                    <span className="bg-gray-50 dark:bg-[#161b22] text-gray-500 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d] rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                                        <i data-lucide="moon" className="w-3 h-3"></i> Sleeping
                                    </span>
                                );
                            }

                            return (
                                <div 
                                    key={agent.id} 
                                    ref={addToStagger}
                                    className={`py-6 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all duration-300 hover:bg-slate-50/30 dark:hover:bg-[#161b22]/20 px-4 -mx-4 rounded-lg ${agent.watchdog === 'Hallucination Blocked' ? 'bg-red-50/10 dark:bg-[#ff7b72]/5' : ''}`}
                                >
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <Link 
                                                to="/repo" 
                                                state={{ agent }}
                                                className="text-[20px] font-semibold text-blue-600 dark:text-[#58a6ff] hover:underline break-all"
                                            >
                                                {agent.name}
                                            </Link>
                                            <span className="border border-gray-300 dark:border-[#30363d] text-gray-500 dark:text-[#8b949e] rounded-full px-2 py-0.5 text-xs font-medium">
                                                {agent.visibility}
                                            </span>
                                            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${agent.environment === 'Cloud' ? 'bg-blue-50 dark:bg-[#388bfd]/10 text-blue-600 dark:text-[#58a6ff] border border-blue-100 dark:border-[#388bfd]/30' : 'bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d]'}`}>
                                                {agent.environment}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4 max-w-2xl">
                                            {agent.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-[#8b949e]">
                                            <span className="flex items-center gap-1.5">
                                                <div className={`w-3 h-3 rounded-full ${langColor}`}></div> {agent.language}
                                            </span>
                                            <a href="#!" className="hover:text-blue-600 dark:hover:text-[#58a6ff] flex items-center gap-1">
                                                <i data-lucide="git-branch" className="w-3.5 h-3.5"></i> {agent.branch}
                                            </a>
                                            <a href="#!" className="hover:text-blue-600 dark:hover:text-[#58a6ff] flex items-center gap-1 font-mono">
                                                <i data-lucide="git-commit" className="w-3.5 h-3.5"></i> {agent.commits.toLocaleString()} commits
                                            </a>
                                            <span>Updated {agent.last_active}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 flex-shrink-0 w-full sm:w-auto">
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-3">
                                            {actionButton}
                                            {watchdogBadge}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
