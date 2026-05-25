import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';

export default function Dashboard() {
    const mainRef = useRef();
    const staggerItemsRef = useRef([]);
    
    // Fetch real-time data
    const { data: metricsData, isLoading: metricsLoading } = useQuery({
        queryKey: ['metrics'],
        queryFn: () => fetch('http://localhost:8000/metrics').then(res => res.json())
    });

    const { data: agentsData, isLoading: agentsLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: () => fetch('http://localhost:8000/agents').then(res => res.json())
    });

    const metrics = metricsData?.data || {};
    const agents = agentsData?.data || [];

    const addToStagger = (el) => {
        if (el && !staggerItemsRef.current.includes(el)) {
            staggerItemsRef.current.push(el);
        }
    };

    useEffect(() => {
        
        
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    useGSAP(() => {
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
    }, { scope: mainRef });

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
            {/* Reusable Global Navbar */}
            <Navbar />

            {/* Main Content Container */}
            <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left Sidebar: Cognitive Repos (Agents) */}
                    <div className="w-full md:w-1/4 flex flex-col gap-6">
                        {/* User Context */}
                        <div ref={addToStagger} className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#30363d] overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=ai-org&background=161b22&color=c9d1d9" alt="ai-org" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-[14px] leading-tight text-gray-900 dark:text-[#c9d1d9]">ai-org</h2>
                            </div>
                        </div>

                        {/* Repo List */}
                        <div ref={addToStagger}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-[#c9d1d9]">Cognitive Repositories</h3>
                                <Link to="/new" className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] text-gray-900 dark:text-white px-2 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition shadow-sm border border-gray-300 dark:border-[rgba(240,246,252,0.1)]">
                                    <i data-lucide="book-plus" className="w-3.5 h-3.5"></i> New
                                </Link>
                            </div>
                            
                            <div className="relative mb-4">
                                <input type="text" placeholder="Find an agent..." className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 dark:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all text-gray-900 dark:text-[#c9d1d9] placeholder-gray-400 dark:placeholder-[#8b949e]" />
                            </div>

                            <ul className="space-y-3.5">
                                {agentsLoading ? (
                                     <li className="text-xs text-gray-500 dark:text-[#8b949e]">Loading cognitive repos...</li>
                                ) : agents.map(agent => {
                                    // Determine icon based on agent type
                                    let iconName = "book";
                                    let typeColorClass = "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
                                    
                                    if (agent.type === "IDE Assistant") {
                                        iconName = "sparkles";
                                        typeColorClass = "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400";
                                    } else if (agent.type === "CLI Developer Agent") {
                                        iconName = "terminal";
                                        typeColorClass = "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400";
                                    } else if (agent.type === "IDE Agent") {
                                        iconName = "cpu";
                                        typeColorClass = "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400";
                                    } else if (agent.type === "Cloud IDE Integration") {
                                        iconName = "globe";
                                        typeColorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400";
                                    }

                                    return (
                                        <li key={agent.id} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-[#161b22]/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#30363d]">
                                            <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-md bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] flex items-center justify-center">
                                                <i data-lucide={iconName} className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap w-full">
                                                    <Link to="/repo" state={{ agent }} className="text-sm font-semibold text-blue-600 dark:text-[#58a6ff] hover:underline truncate block w-full max-w-[220px]" title={`${agent.org}/${agent.name}`}>{agent.org}/{agent.name}</Link>
                                                    {agent.type && (
                                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${typeColorClass}`}>
                                                            {agent.type}
                                                        </span>
                                                    )}
                                                </div>
                                                {agent.description && (
                                                    <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mt-0.5 truncate" title={agent.description}>
                                                        {agent.description}
                                                    </p>
                                                )}
                                                <span className="text-xs text-gray-500 dark:text-[#8b949e] flex items-center gap-1 mt-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-[#3fb950]' : 'bg-[#8b949e]'}`}></div> 
                                                    {agent.status} • {agent.last_active && `${agent.last_active}`}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <a href="#!" className="text-xs text-gray-500 dark:text-[#8b949e] hover:text-blue-600 dark:text-[#58a6ff] hover:underline mt-4 block transition">Show more...</a>
                        </div>
                        
                        <hr className="border-gray-200 dark:border-[#30363d]" />
                        
                        <div ref={addToStagger}>
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-[#c9d1d9] mb-3">Recent activity</h3>
                            <div className="text-sm text-gray-500 dark:text-[#8b949e] border border-dashed border-gray-200 dark:border-[#30363d] rounded-md p-4 text-center">
                                When you have activity, it will show up here.
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Cognitive Stream (Activity Feed) */}
                    <div className="w-full md:w-1/2 flex flex-col gap-4">
                        <div ref={addToStagger} className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-normal text-gray-900 dark:text-[#c9d1d9]">Cognitive Stream</h2>
                            <div className="flex gap-2">
                                <button className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:text-[#c9d1d9] px-2 py-1 rounded transition">Following</button>
                                <button className="text-xs font-semibold text-gray-900 dark:text-[#c9d1d9] px-2 py-1 rounded">For you</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            
                            {/* Event 1: Branch Merge */}
                            <div ref={addToStagger} className="flex gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] flex items-center justify-center">
                                        <i data-lucide="git-merge" className="w-4 h-4 text-[#a371f7]"></i>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md w-full overflow-hidden">
                                    <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] p-3 text-sm flex justify-between items-center">
                                        <div>
                                            <a href="#!" className="font-semibold text-gray-900 dark:text-[#c9d1d9] hover:text-blue-600 dark:text-[#58a6ff]">code-reviewer</a> merged reasoning path <span className="font-mono text-xs bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] px-1 rounded text-[#a371f7]">refactor-logic</span>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-[#8b949e]">10m ago</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="text-sm text-gray-500 dark:text-[#8b949e] mb-3">Completed analysis of 14 Python files with 0 critical security issues.</div>
                                        <div className="flex gap-4">
                                            <span className="text-xs text-gray-500 dark:text-[#8b949e] flex items-center gap-1.5"><i data-lucide="git-commit" className="w-3.5 h-3.5 text-gray-500 dark:text-[#8b949e]"></i> 12 commits</span>
                                            <span className="text-xs text-gray-500 dark:text-[#8b949e] flex items-center gap-1.5"><i data-lucide="zap" className="w-3.5 h-3.5 text-[#e3b341]"></i> 4,502 tokens</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event 2: Watchdog Alert */}
                            <div ref={addToStagger} className="flex gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] flex items-center justify-center">
                                        <i data-lucide="shield-alert" className="w-4 h-4 text-red-600 dark:text-[#ff7b72]"></i>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md w-full overflow-hidden">
                                    <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] p-3 text-sm flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-red-600 dark:text-[#ff7b72]">Watchdog Overseer</span> intercepted a commit in <a href="#!" className="font-semibold text-gray-900 dark:text-[#c9d1d9] hover:text-blue-600 dark:text-[#58a6ff]">financial-research</a>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-[#8b949e]">1h ago</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="border border-gray-200 dark:border-[#30363d] rounded p-3 mb-3 text-sm">
                                            <div className="font-semibold text-red-600 dark:text-[#ff7b72] text-xs uppercase tracking-wide mb-1">Reason for Rollback</div>
                                            <p className="text-gray-500 dark:text-[#8b949e]">Agent hallucinated Q3 earnings data. Expected reference from Tool(YahooFinance), but model generated synthetic data instead.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] text-gray-500 dark:text-[#8b949e] text-[10px] px-1.5 py-0.5 rounded font-mono">HEAD~1</span>
                                            <span className="text-xs text-gray-500 dark:text-[#8b949e]">Automatically restored stable context state.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:bg-gray-200 dark:hover:bg-[#30363d] py-2 text-sm font-semibold text-blue-600 dark:text-[#58a6ff] transition rounded-md">
                                More activity
                            </button>

                        </div>
                    </div>

                    {/* Right Sidebar: System Health & Explore */}
                    <div className="w-full md:w-1/4 flex flex-col gap-6">
                        
                        {/* Global Health Stats */}
                        <div ref={addToStagger} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md p-4">
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-[#c9d1d9] mb-4 flex items-center gap-2">
                                <i data-lucide="activity" className="w-4 h-4 text-green-600 dark:text-[#3fb950]"></i> System Health
                            </h3>
                            
                            <div className="space-y-4">
                                {metricsLoading ? (
                                    <div className="text-xs text-gray-500 dark:text-[#8b949e]">Loading metrics...</div>
                                ) : (
                                    <>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-500 dark:text-[#8b949e] font-medium">Memory Integrity</span>
                                                <span className="text-green-600 dark:text-[#3fb950] font-semibold">{metrics.memory_integrity || 0}%</span>
                                            </div>
                                            <div className="w-full bg-white dark:bg-[#161b22] rounded-full h-1.5 overflow-hidden border border-gray-200 dark:border-[#30363d]">
                                                <div className="bg-[#3fb950] h-1.5 rounded-full" style={{ width: `${metrics.memory_integrity || 0}%` }}></div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded p-2 text-center">
                                                <div className="text-xl font-light text-gray-900 dark:text-[#c9d1d9]">{metrics.active_agents || 0}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-[#8b949e] mt-1">Active Agents</div>
                                            </div>
                                            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded p-2 text-center">
                                                <div className="text-xl font-light text-red-600 dark:text-[#ff7b72]">{metrics.rollbacks || 0}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-[#8b949e] mt-1">Rollbacks</div>
                                            </div>
                                        </div>
                                        
                                        <div className="border-t border-gray-200 dark:border-[#30363d] pt-3 mt-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 dark:text-[#8b949e] flex items-center gap-1.5"><i data-lucide="zap" className="w-3.5 h-3.5 text-[#e3b341]"></i> API Tokens</span>
                                                <span className="font-mono text-gray-900 dark:text-[#c9d1d9] text-xs">{((metrics.api_tokens_used || 0) / 1000000).toFixed(1)}M / {((metrics.api_tokens_total || 5000000) / 1000000).toFixed(0)}M</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Explore / Templates */}
                        <div ref={addToStagger}>
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-[#c9d1d9] mb-3">Agent Templates</h3>
                            <div className="border border-gray-200 dark:border-[#30363d] rounded-md divide-y divide-[#30363d]">
                                <div className="p-3 hover:bg-white dark:bg-[#161b22] transition cursor-pointer">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#c9d1d9]">Auto-Dev Tool</h4>
                                    <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1 line-clamp-2">An agent pre-configured with bash tools and file writing capabilities.</p>
                                </div>
                                <div className="p-3 hover:bg-white dark:bg-[#161b22] transition cursor-pointer">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#c9d1d9]">Research Analyst</h4>
                                    <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1 line-clamp-2">Optimized for web scraping, PDF reading, and markdown synthesis.</p>
                                </div>
                            </div>
                            <a href="#!" className="text-xs text-blue-600 dark:text-[#58a6ff] hover:underline mt-2 block">
                                Explore more templates
                            </a>
                        </div>

                        {/* Footer Links */}
                        <div ref={addToStagger} className="text-xs text-gray-500 dark:text-[#8b949e] flex flex-wrap gap-x-3 gap-y-1 mt-2">
                            <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Docs</a>
                            <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">API</a>
                            <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Training</a>
                            <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Pricing</a>
                            <span>© 2026 CognitionVCS</span>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
