import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';

export default function RepoDashboard() {
    const location = useLocation();
    const selectedAgent = location.state?.agent || {
        id: "agent-1",
        org: "ai-org",
        name: "financial-research-agent",
        type: "Cloud Agent",
        description: "Collects market info and writes cognitive commits.",
        status: "Active"
    };

    const [activeTab, setActiveTab] = useState('tree-view');
    const [selectedCommit, setSelectedCommit] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const treeRef = useRef(null);

    // Fetch commits for a specific branch & selected agent
    const { data: commitsResponse, isLoading: commitsLoading } = useQuery({
        queryKey: ['commits', 'branch-1', selectedAgent.id],
        queryFn: () => fetch(`http://localhost:8000/commits/branch/1?agent_id=${selectedAgent.id}`, {
            headers: {
                'Authorization': 'Bearer mock-secure-api-key'
            }
        }).then(res => res.json())
    });

    const commits = commitsResponse?.data || [];

    // Auto-select the first commit when data loads so the inspector isn't empty
    useEffect(() => {
        if (commits.length > 0 && !selectedCommit) {
            setSelectedCommit(commits[0]);
        }
    }, [commits, selectedCommit]);

    useEffect(() => {


        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Re-run icons when tab changes
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeTab, commits, searchTerm]);

    useGSAP(() => {
        if (activeTab === 'tree-view' && treeRef.current) {
            const nodes = gsap.utils.toArray('.tree-node', treeRef.current);
            if (nodes.length > 0) {
                gsap.fromTo(nodes,
                    { opacity: 0, x: -20 },
                    { opacity: 1, x: 0, stagger: 0.1, duration: 0.4, ease: "power2.out" }
                );
            }
        }
    }, [activeTab, commits]);

    // Refetch data instead of simulating hardcoded thoughts
    const handleRefresh = () => {
        setIsSimulating(true);
        fetch(`http://localhost:8000/commits/branch/1?agent_id=${selectedAgent.id}`, {
            headers: { 'Authorization': 'Bearer mock-secure-api-key' }
        })
            .then(res => res.json())
            .then(data => {
                setIsSimulating(false);
                // In a real app we'd use React Query's refetch() here
            })
            .catch(() => setIsSimulating(false));
    };

    return (
        <div className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
            {/* Reusable Global Navbar */}
            <Navbar />

            {/* Repo Header */}
            <div className="bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] pt-4 px-8">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-xl">
                        <i data-lucide="book" className="text-gray-500 dark:text-[#8b949e] w-5 h-5"></i>
                        <a href="#!" className="text-blue-600 dark:text-[#58a6ff] hover:underline font-medium">{selectedAgent.org}</a>
                        <span className="text-gray-500 dark:text-[#8b949e]">/</span>
                        <a href="#!" className="text-blue-600 dark:text-[#58a6ff] hover:underline font-semibold">{selectedAgent.name}</a>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium border border-gray-200 dark:border-[#30363d] rounded-full text-gray-500 dark:text-[#8b949e]">{selectedAgent.type || 'Cloud Agent'}</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-gray-100 dark:bg-[#21262d] hover:bg-gray-200 dark:hover:bg-[#30363d] border border-gray-300 dark:border-[rgba(240,246,252,0.1)] px-3 py-1 text-xs rounded-md font-medium flex items-center gap-2 transition text-gray-900 dark:text-[#c9d1d9]">
                            <i data-lucide="eye" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i> Watch <span className="bg-white dark:bg-[#0d1117] px-1.5 rounded-full border border-gray-200 dark:border-[#30363d]">12</span>
                        </button>
                        <button className="bg-gray-100 dark:bg-[#21262d] hover:bg-gray-200 dark:hover:bg-[#30363d] border border-gray-300 dark:border-[rgba(240,246,252,0.1)] px-3 py-1 text-xs rounded-md font-medium flex items-center gap-2 transition text-gray-900 dark:text-[#c9d1d9]">
                            <i data-lucide="git-fork" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i> Fork <span className="bg-white dark:bg-[#0d1117] px-1.5 rounded-full border border-gray-200 dark:border-[#30363d]">4</span>
                        </button>
                    </div>
                </div>

                {/* Repo Tabs */}
                <div className="flex gap-6 mt-6 border-b border-gray-200 dark:border-[#30363d] mb-[-1px]">
                    <button onClick={() => setActiveTab('tree-view')} className={`pb-2 flex items-center gap-2 text-sm font-medium ${activeTab === 'tree-view' ? 'border-b-2 border-[#f78166] text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:text-[#c9d1d9] border-b-2 border-transparent'}`}>
                        <i data-lucide="git-branch" className="w-4 h-4"></i> Memory Tree
                    </button>
                    <button onClick={() => setActiveTab('commits-view')} className={`pb-2 flex items-center gap-2 text-sm font-medium ${activeTab === 'commits-view' ? 'border-b-2 border-[#f78166] text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:text-[#c9d1d9] border-b-2 border-transparent'}`}>
                        <i data-lucide="history" className="w-4 h-4"></i> Thought Log
                    </button>
                    <button onClick={() => setActiveTab('watchdog-view')} className={`pb-2 flex items-center gap-2 text-sm font-medium ${activeTab === 'watchdog-view' ? 'border-b-2 border-[#f78166] text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:text-[#c9d1d9] border-b-2 border-transparent'}`}>
                        <i data-lucide="shield-alert" className="w-4 h-4"></i> Watchdog Alerts
                        <span className="bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9] border border-gray-200 dark:border-[#30363d] text-[10px] px-1.5 py-0.5 rounded-full leading-none">1</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow bg-white dark:bg-[#0d1117] p-8">

                {/* VIEW: MEMORY TREE */}
                {activeTab === 'tree-view' && (
                    <div ref={treeRef} className="max-w-7xl mx-auto flex gap-6">
                        {/* Left Column: The Graph */}
                        <div className="w-2/3">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <button className="bg-gray-100 dark:bg-[#21262d] border border-gray-300 dark:border-[rgba(240,246,252,0.1)] px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#30363d]">
                                        <i data-lucide="git-branch" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i> main <i data-lucide="chevron-down" className="w-3 h-3 text-gray-500 dark:text-[#8b949e]"></i>
                                    </button>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8b949e]">
                                        <div className={`w-2 h-2 rounded-full ${selectedAgent.status === 'Active' ? 'bg-[#3fb950] shadow-[0_0_5px_#3fb950]' : 'bg-[#8b949e]'}`}></div>
                                        Agent is {selectedAgent.status || 'Active'}
                                    </div>
                                </div>
                                <button className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] border border-gray-300 dark:border-[rgba(240,246,252,0.1)] text-gray-900 dark:text-white px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition" onClick={handleRefresh} disabled={isSimulating || commitsLoading}>
                                    <i data-lucide="refresh-cw" className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`}></i> {isSimulating ? 'Refreshing...' : 'Refresh State'}
                                </button>
                            </div>

                            <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md p-6">
                                <div className="relative pl-2">
                                    {commits.map((commit, index) => {
                                        const isLast = index === commits.length - 1 && !isSimulating;
                                        const isHallucination = commit.type === 'hallucination';
                                        const isBranch = commit.branch !== 'main';
                                        const nodeColor = commit.type === 'initial' ? 'bg-white dark:bg-[#161b22] border-gray-200 dark:border-[#30363d] text-gray-500 dark:text-[#8b949e]' : isHallucination ? 'bg-white dark:bg-[#161b22] border-red-600 dark:border-[#ff7b72] text-red-600 dark:text-[#ff7b72]' : 'bg-white dark:bg-[#161b22] border-green-600 dark:border-[#3fb950] text-green-600 dark:text-[#3fb950]';
                                        const marginLeft = isBranch ? 'ml-12' : 'ml-0';

                                        return (
                                            <div key={commit.id} className={`tree-node relative pb-8 ${marginLeft} cursor-pointer group`} onClick={() => setSelectedCommit(commit)}>
                                                {!isLast && !isBranch && <div className="absolute left-5 top-10 w-0.5 h-full bg-[#30363d]"></div>}
                                                {isBranch && (
                                                    <>
                                                        <div className="absolute left-[-24px] top-[20px] w-[32px] h-[2px] bg-[#30363d]"></div>
                                                        <div className="absolute left-[-24px] top-[-20px] w-[2px] h-[40px] bg-[#30363d]"></div>
                                                    </>
                                                )}
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-full border-2 ${nodeColor} flex items-center justify-center group-hover:border-white transition z-10`}>
                                                        {commit.type === 'initial' ? <i data-lucide="power" className="w-4 h-4"></i> : isHallucination ? <i data-lucide="shield-alert" className="w-4 h-4"></i> : <i data-lucide="check" className="w-4 h-4"></i>}
                                                    </div>
                                                    <div className="flex-grow pt-1">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="text-sm font-semibold text-blue-600 dark:text-[#58a6ff] group-hover:underline">{commit.message}</h4>
                                                            <span className="text-xs text-gray-500 dark:text-[#8b949e]">{commit.time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="font-mono text-xs text-gray-500 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d] px-1.5 py-0.5 rounded">{commit.id}</span>
                                                            {isHallucination ? (
                                                                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-[#ff7b72] border border-red-600 dark:border-[#ff7b72] px-1.5 py-0.5 rounded">Rolled Back</span>
                                                            ) : (
                                                                <span className="text-[10px] uppercase font-bold text-green-600 dark:text-[#3fb950] border border-green-600 dark:border-[#3fb950] px-1.5 py-0.5 rounded">Merged</span>
                                                            )}
                                                            <span className="text-[10px] text-gray-500 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d] px-1.5 py-0.5 rounded flex items-center gap-1"><i data-lucide="git-branch" className="w-3 h-3"></i> {commit.branch}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {isSimulating && (
                                        <div className="tree-node relative pb-8 ml-0 animate-pulse">
                                            <div className="absolute left-5 top-[-30px] w-0.5 h-full bg-[#30363d]"></div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 dark:border-[#58a6ff] border-dashed flex items-center justify-center bg-white dark:bg-[#161b22] z-10">
                                                    <i data-lucide="loader" className="w-4 h-4 text-blue-600 dark:text-[#58a6ff] animate-spin"></i>
                                                </div>
                                                <div className="flex-grow pt-2">
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#c9d1d9]">Agent is reasoning...</h4>
                                                    <span className="text-xs text-gray-500 dark:text-[#8b949e]">Awaiting watchdog verification</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Inspector Sidebar */}
                        <div className="w-1/3">
                            <div className="sticky top-6">
                                <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md flex flex-col h-[600px] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-4 py-3 flex justify-between items-center rounded-t-md">
                                        <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-[#c9d1d9]">
                                            <i data-lucide="search" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i> Thought Inspector
                                        </h3>
                                        <span className="font-mono text-xs text-gray-500 dark:text-[#8b949e] bg-gray-100 dark:bg-[#21262d] px-2 py-0.5 rounded-md border border-gray-200 dark:border-[#30363d]">{selectedCommit ? selectedCommit.id : '--'}</span>
                                    </div>

                                    <div className="p-4 overflow-y-auto flex-grow text-sm text-gray-900 dark:text-[#c9d1d9] flex flex-col gap-5 bg-white dark:bg-[#0d1117]">
                                        {!selectedCommit ? (
                                            <div key="empty-state" className="text-center py-10 text-gray-500 dark:text-[#8b949e] flex flex-col items-center">
                                                <i data-lucide="mouse-pointer-click" className="w-8 h-8 mb-2 opacity-50"></i>
                                                Select a commit from the memory tree to inspect its cognitive state.
                                            </div>
                                        ) : (
                                            <div key="content-state" className="flex flex-col gap-5">
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-2">Internal Prompt</h4>
                                                    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded p-3 text-gray-900 dark:text-[#c9d1d9] font-mono text-xs whitespace-pre-wrap">{selectedCommit?.details?.prompt || 'No internal prompt recorded.'}</div>
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-2">Action / Tool Call</h4>
                                                    <div className="bg-gray-50 dark:bg-[#010409] border border-green-600 dark:border-[#2ea043] rounded p-3 text-green-600 dark:text-[#3fb950] font-mono text-xs shadow-[inset_0_0_10px_rgba(46,160,67,0.1)]">{selectedCommit?.details?.tool || 'None'}</div>
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-2">Resulting State / Output</h4>
                                                    <div className="bg-[rgba(56,139,253,0.05)] border border-[#388bfd] rounded p-3 text-blue-600 dark:text-[#58a6ff] font-mono text-xs whitespace-pre-wrap shadow-[inset_0_0_10px_rgba(56,139,253,0.1)]">{selectedCommit?.details?.output || 'No output data.'}</div>
                                                </div>
                                                {selectedCommit?.details?.watchdog && (
                                                    <div key="watchdog-alert" className="mt-1 bg-[rgba(248,81,73,0.05)] border border-red-600 dark:border-[#f85149] rounded p-3 shadow-[inset_0_0_10px_rgba(248,81,73,0.1)]">
                                                        <div className="text-[11px] font-bold text-red-600 dark:text-[#ff7b72] uppercase flex items-center gap-1 mb-2">
                                                            <i data-lucide="shield-alert" className="w-3 h-3"></i> Watchdog Verdict
                                                        </div>
                                                        <div className="text-sm text-red-600 dark:text-[#ff7b72]">{selectedCommit?.details?.watchdog}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedCommit && (
                                        <div className="border-t border-gray-200 dark:border-[#30363d] p-3 bg-white dark:bg-[#161b22] flex gap-2 rounded-b-md">
                                            <button className="flex-1 bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-200 dark:hover:bg-[#30363d] hover:text-gray-900 dark:text-white px-2 py-1.5 text-xs font-medium rounded text-red-600 dark:text-[#ff7b72] flex justify-center items-center gap-1 transition shadow-sm">
                                                <i data-lucide="rotate-ccw" className="w-3 h-3"></i> Rollback Here
                                            </button>
                                            <button className="flex-1 bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-200 dark:hover:bg-[#30363d] hover:text-gray-900 dark:text-white px-2 py-1.5 text-xs font-medium rounded text-gray-900 dark:text-[#c9d1d9] flex justify-center items-center gap-1 transition shadow-sm">
                                                <i data-lucide="git-fork" className="w-3 h-3"></i> Branch From
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: THOUGHT LOG */}
                {activeTab === 'commits-view' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md">
                            <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-4 py-3 flex justify-between items-center rounded-t-md">
                                <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Commit History</h2>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Search commits..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded px-3 py-1 text-xs focus:outline-none focus:border-blue-600 dark:border-[#58a6ff] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#8b949e]" 
                                    />
                                </div>
                            </div>
                            <div className="divide-y divide-[#30363d]">
                                {(() => {
                                    const filteredCommits = commits.filter(commit => 
                                        (commit.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (commit.id || '').toLowerCase().includes(searchTerm.toLowerCase())
                                    );
                                    const reversedCommits = [...filteredCommits].reverse();
                                    
                                    if (reversedCommits.length === 0) {
                                        return (
                                            <div className="p-8 text-center text-gray-500 dark:text-[#8b949e] flex flex-col items-center">
                                                <i data-lucide="search" className="w-8 h-8 mb-2 opacity-50"></i>
                                                <p>No commits match your search query.</p>
                                            </div>
                                        );
                                    }
                                    
                                    return reversedCommits.map(commit => (
                                        <div key={commit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#161b22]/50 flex items-start gap-3 transition">
                                            <i data-lucide={commit.type === 'hallucination' ? 'x' : 'check'} className={`w-5 h-5 mt-0.5 ${commit.type === 'hallucination' ? 'text-red-600 dark:text-[#ff7b72]' : 'text-green-600 dark:text-[#3fb950]'}`}></i>
                                            <div className="flex-grow">
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-[#c9d1d9] hover:text-blue-600 dark:text-[#58a6ff] hover:underline cursor-pointer" onClick={() => { setActiveTab('tree-view'); setSelectedCommit(commit); }}>{commit.message}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-[#8b949e]">
                                                    <span>Committed {commit.time}</span>
                                                    <span>•</span>
                                                    <span className="font-mono bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] px-1 rounded">{commit.id}</span>
                                                </div>
                                            </div>
                                            <button className="bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-200 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-2 py-1 text-xs rounded transition" onClick={() => { setActiveTab('tree-view'); setSelectedCommit(commit); }}>
                                                <i data-lucide="code" className="w-3 h-3 inline mr-1"></i> View State
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: WATCHDOG ALERTS */}
                {activeTab === 'watchdog-view' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Watchdog Activity</h2>
                            <p className="text-sm text-gray-500 dark:text-[#8b949e]">The Overseer LLM scans all proposed commits for hallucinations and logic errors before merging them into memory.</p>
                        </div>

                        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md">
                            <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-4 py-3 flex justify-between items-center text-gray-900 dark:text-white rounded-t-md">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <i data-lucide="shield-alert" className="w-4 h-4 text-red-600 dark:text-[#ff7b72]"></i> 1 Intercepted Hallucination
                                </h3>
                            </div>

                            <div className="p-4 border-b border-gray-200 dark:border-[#30363d] hover:bg-white dark:bg-[#161b22] transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="border border-red-600 dark:border-[#ff7b72] text-red-600 dark:text-[#ff7b72] px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">Blocked</span>
                                        <span className="font-medium text-sm text-gray-900 dark:text-[#c9d1d9]">Agent hallucinated financial data</span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-[#8b949e]">2 mins ago</span>
                                </div>
                                <div className="text-sm text-gray-900 dark:text-[#c9d1d9] mb-3 bg-white dark:bg-[#0d1117] p-3 rounded border border-gray-200 dark:border-[#30363d] font-mono text-xs">
                                    <span className="text-gray-500 dark:text-[#8b949e]">// Attempted Output:</span><br />
                                    "Based on the tool search, Tesla's stock price today is <span className="bg-white dark:bg-[#161b22] text-red-600 dark:text-[#ff7b72] px-1 rounded border border-red-600 dark:border-[#ff7b72]">$14,000</span> per share."
                                </div>
                                <div className="text-sm">
                                    <strong className="text-gray-500 dark:text-[#8b949e] text-xs uppercase tracking-wide">Overseer Reasoning:</strong>
                                    <p className="mt-1 text-gray-900 dark:text-[#c9d1d9]">The agent misinterpreted market cap data as the share price. The actual share price retrieved from the tool was $175. Flagged as a severe numeric hallucination. Commit rejected and automatic rollback to HEAD~1 initiated.</p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button className="bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-200 dark:hover:bg-[#30363d] text-gray-900 dark:text-white px-3 py-1.5 text-xs rounded font-medium transition">View Diff</button>
                                    <button className="bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-200 dark:hover:bg-[#30363d] text-gray-900 dark:text-white px-3 py-1.5 text-xs rounded font-medium transition">View Agent Context</button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
