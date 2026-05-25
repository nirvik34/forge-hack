import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`;

export default function WatchdogSettings() {
    const mainRef = useRef(null);
    const staggerItemsRef = useRef([]);
    const queryClient = useQueryClient();

    // Active sidebar tab
    const [activeTab, setActiveTab] = useState('general');

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '' });

    // Settings state
    const [masterEnabled, setMasterEnabled] = useState(true);
    const [overseerEngine, setOverseerEngine] = useState('gemini-flash');

    // Threat model toggles
    const [syntheticLibrary, setSyntheticLibrary] = useState(true);
    const [promptInjection, setPromptInjection] = useState(true);
    const [semanticDrift, setSemanticDrift] = useState(true);
    const [infiniteLoop, setInfiniteLoop] = useState(false);
    const [driftValue, setDriftValue] = useState(15);

    // Automated actions
    const [defaultAction, setDefaultAction] = useState('hard_rollback');
    const [slackNotification, setSlackNotification] = useState(true);

    // Golden contexts
    const [goldenContextJSON, setGoldenContextJSON] = useState('');

    // Saving state
    const [isSaving, setIsSaving] = useState(false);

    // Fetch watchdog rules from backend
    const { data: rulesData } = useQuery({
        queryKey: ['watchdog-rules'],
        queryFn: () => fetch(`${API_BASE}/scan/rules`).then(res => res.json())
    });

    // Sync fetched rules with local state
    useEffect(() => {
        if (rulesData?.data) {
            const rules = rulesData.data;
            const r1 = rules.find(r => r.id === 'rule-1');
            const r2 = rules.find(r => r.id === 'rule-2');
            const r3 = rules.find(r => r.id === 'rule-3');
            const r4 = rules.find(r => r.id === 'rule-4');
            if (r1) setSyntheticLibrary(r1.enabled);
            if (r2) setPromptInjection(r2.enabled);
            if (r3) setSemanticDrift(r3.enabled);
            if (r4) setInfiniteLoop(r4.enabled);
        }
    }, [rulesData]);

    // Mutation to update rules
    const updateRulesMutation = useMutation({
        mutationFn: (rules) => {
            return fetch(`${API_BASE}/scan/rules/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules })
            }).then(res => res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchdog-rules'] });
        }
    });

    // Save all rules
    const handleSaveRules = () => {
        setIsSaving(true);
        const updatedRules = [
            { id: 'rule-1', name: 'Generalization Boundary (Dependency Verification)', enabled: syntheticLibrary, severity: 'critical' },
            { id: 'rule-2', name: 'Core Identity & Security Constraints', enabled: promptInjection, severity: 'critical' },
            { id: 'rule-3', name: 'Formatting & Schema Matching', enabled: semanticDrift, severity: 'warning' },
            { id: 'rule-4', name: 'API Secret Leak Prevention', enabled: infiniteLoop, severity: 'critical' }
        ];

        updateRulesMutation.mutate(updatedRules, {
            onSuccess: () => {
                setIsSaving(false);
                triggerToast('Watchdog rules successfully updated.');
            },
            onError: () => {
                setIsSaving(false);
                triggerToast('Failed to update rules.');
            }
        });
    };

    const triggerToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
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
    }, { scope: mainRef });

    // Initialize Lucide Icons
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeTab, masterEnabled, syntheticLibrary, promptInjection, semanticDrift, infiniteLoop, defaultAction, slackNotification, toast]);

    // Toggle Switch component
    const ToggleSwitch = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1f883d]"></div>
        </label>
    );

    const sidebarItems = [
        { id: 'general', label: 'General Settings', icon: 'sliders' },
        { id: 'threats', label: 'Threat Models', icon: 'shield-alert' },
        { id: 'actions', label: 'Automated Actions', icon: 'rotate-ccw' },
        { id: 'context', label: 'Golden Contexts', icon: 'pin' }
    ];

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
            <Navbar />

            {/* Toast Notification */}
            <div className={`fixed bottom-5 right-5 z-50 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 transform transition-all duration-300 text-sm font-medium ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <i data-lucide="check-circle" className="w-5 h-5 text-green-600 dark:text-green-400"></i>
                <span>{toast.message}</span>
            </div>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-[1024px] mx-auto px-4 md:px-8 py-8">

                {/* Breadcrumbs & Header */}
                <div ref={addToStagger} className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8b949e] mb-2">
                        <Link to="/watchdog" className="hover:text-[#0969da] dark:hover:text-[#58a6ff] hover:underline">Watchdog Sentinels</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white font-semibold">Configure Rules</span>
                    </div>
                    <div className="flex justify-between items-end pb-4 border-b border-gray-200 dark:border-[#30363d]">
                        <div>
                            <h1 className="text-2xl font-normal text-gray-900 dark:text-white">Global Watchdog Policies</h1>
                            <p className="text-sm text-gray-500 dark:text-[#8b949e] mt-1">Configure how the Overseer LLM evaluates commits across all your agent repositories.</p>
                        </div>
                        <button
                            onClick={handleSaveRules}
                            disabled={isSaving}
                            className="bg-[#1f883d] hover:bg-[#1a7f37] text-white border border-[rgba(27,31,36,0.15)] px-4 py-1.5 rounded-md text-sm font-medium transition shadow-sm flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i data-lucide="save" className="w-4 h-4"></i> Save Rules
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Left Sidebar Navigation */}
                    <aside ref={addToStagger} className="w-full md:w-1/4 flex flex-col gap-1">
                        <nav className="flex flex-col space-y-1">
                            {sidebarItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition ${activeTab === item.id
                                            ? 'font-semibold bg-gray-100 dark:bg-[#161b22] text-gray-900 dark:text-white border-l-[3px] border-[#fd8c73] rounded-l-none'
                                            : 'text-gray-700 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#161b22]/50'
                                        }`}
                                >
                                    <i data-lucide={item.icon} className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                                    {item.label}
                                </div>
                            ))}
                        </nav>
                    </aside>

                    {/* Right Content Area */}
                    <section className="w-full md:w-3/4 pb-12">

                        {/* TAB: General Settings */}
                        {activeTab === 'general' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">General Watchdog Settings</h2>

                                <div className="border border-gray-200 dark:border-[#30363d] rounded-md bg-white dark:bg-[#161b22]">
                                    <div className="p-5 border-b border-gray-200 dark:border-[#30363d] flex justify-between items-start hover:bg-gray-50 dark:hover:bg-[#161b22]/80 transition">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Master Watchdog Switch</h3>
                                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Enable or disable the Overseer LLM entirely. Disabling will allow raw, unchecked commits to merge instantly (faster, but dangerous).</p>
                                        </div>
                                        <div className="mt-1">
                                            <ToggleSwitch checked={masterEnabled} onChange={() => setMasterEnabled(!masterEnabled)} />
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Overseer Engine Selection</h3>
                                        <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-3">Select which connected API should act as the judge for incoming commits. <span className="font-semibold text-gray-800 dark:text-white">Gemini 2.5 Flash</span> is recommended for low-latency scanning.</p>
                                        <select
                                            value={overseerEngine}
                                            onChange={(e) => setOverseerEngine(e.target.value)}
                                            className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff] w-full md:w-1/2 cursor-pointer"
                                        >
                                            <option value="gemini-flash">Google Gemini 2.5 Flash (Recommended)</option>
                                            <option value="gemini-pro">Google Gemini 2.5 Pro</option>
                                            <option value="gpt-4o">OpenAI GPT-4o</option>
                                            <option value="ollama">Local Model (Ollama)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: Threat Models */}
                        {activeTab === 'threats' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">HalMit Threat Detection Vectors</h2>

                                <div className="border border-gray-200 dark:border-[#30363d] rounded-md overflow-hidden divide-y divide-gray-200 dark:divide-[#30363d] bg-white dark:bg-[#161b22]">

                                    {/* Rule 1: Synthetic Library */}
                                    <div className="p-4 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-[#161b22]/80 transition">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <ToggleSwitch checked={syntheticLibrary} onChange={() => setSyntheticLibrary(!syntheticLibrary)} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Synthetic Library/API Detection</h3>
                                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1 mb-2">Blocks the agent if it attempts to import, call, or utilize tool functions and code libraries that do not exist (a common generative hallucination).</p>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded p-2 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                                <i data-lucide="info" className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"></i>
                                                Requires the Overseer LLM to cross-reference PyPI, npm, and provided tool definitions.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rule 2: Prompt Injection */}
                                    <div className="p-4 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-[#161b22]/80 transition">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <ToggleSwitch checked={promptInjection} onChange={() => setPromptInjection(!promptInjection)} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Prompt Injection Mitigation</h3>
                                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Scans incoming web-scraped data and external API returns for malicious framing attempts (e.g., "Ignore previous instructions").</p>
                                        </div>
                                    </div>

                                    {/* Rule 3: Semantic Drift Slider */}
                                    <div className="p-4 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-[#161b22]/80 transition bg-slate-50/30 dark:bg-[#161b22]/50">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <ToggleSwitch checked={semanticDrift} onChange={() => setSemanticDrift(!semanticDrift)} />
                                        </div>
                                        <div className="w-full">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex justify-between">
                                                Semantic Drift Boundary
                                                <span className="text-[#0969da] dark:text-[#58a6ff] font-mono bg-blue-50 dark:bg-blue-900/30 px-1.5 rounded">{driftValue}%</span>
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1 mb-3">Establishes the mathematical "Generalization Boundary". If the agent's current commit deviates from the original system prompt intent by this percentage, it is flagged.</p>

                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                value={driftValue}
                                                onChange={(e) => setDriftValue(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#1f883d]"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-400 dark:text-[#8b949e] mt-1.5 font-mono">
                                                <span>Strict (1%)</span>
                                                <span>Loose (50%)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rule 4: Infinite Loop */}
                                    <div className="p-4 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-[#161b22]/80 transition">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <ToggleSwitch checked={infiniteLoop} onChange={() => setInfiniteLoop(!infiniteLoop)} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Infinite Loop Circuit Breaker</h3>
                                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Detects cyclical reasoning paths where an agent repeats the same Observation-Thought-Action sequence across multiple commits.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: Automated Actions */}
                        {activeTab === 'actions' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Automated Actions & Mitigation</h2>

                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Default Violation Action</h3>
                                    <p className="text-xs text-gray-600 dark:text-[#8b949e] mb-3">When the Overseer LLM detects a critical hallucination or boundary violation, what should CognitionVCS do?</p>

                                    <div className="border border-gray-200 dark:border-[#30363d] rounded-md overflow-hidden divide-y divide-gray-200 dark:divide-[#30363d]">

                                        <label className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#161b22]/80 transition bg-white dark:bg-[#161b22] ${defaultAction === 'hard_rollback' ? 'ring-1 ring-[#1f883d] ring-inset' : ''}`}>
                                            <input type="radio" name="default_action" className="mt-1 w-4 h-4 accent-[#1f883d]" checked={defaultAction === 'hard_rollback'} onChange={() => setDefaultAction('hard_rollback')} />
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">Strict: Hard Rollback (Recommended)</div>
                                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-0.5 leading-relaxed">Instantly reject the commit and execute <code className="font-mono bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] px-1 rounded text-red-600 dark:text-[#ff7b72]">cvc reset --hard HEAD~1</code>. The agent is forced to retry from the last verified safe state.</div>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#161b22]/80 transition bg-white dark:bg-[#161b22] ${defaultAction === 'quarantine' ? 'ring-1 ring-[#1f883d] ring-inset' : ''}`}>
                                            <input type="radio" name="default_action" className="mt-1 w-4 h-4 accent-[#1f883d]" checked={defaultAction === 'quarantine'} onChange={() => setDefaultAction('quarantine')} />
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">Quarantine: Branch and Isolate</div>
                                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-0.5 leading-relaxed">Move the corrupted state to an isolated <code className="font-mono bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] px-1 rounded text-purple-600 dark:text-[#a371f7]">quarantine</code> branch for human review. Agent continues on main branch from HEAD~1.</div>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#161b22]/80 transition bg-white dark:bg-[#161b22] ${defaultAction === 'warn' ? 'ring-1 ring-[#1f883d] ring-inset' : ''}`}>
                                            <input type="radio" name="default_action" className="mt-1 w-4 h-4 accent-[#1f883d]" checked={defaultAction === 'warn'} onChange={() => setDefaultAction('warn')} />
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">Lenient: Warn and Continue</div>
                                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-0.5 leading-relaxed">Allow the commit to merge into the main reasoning branch, but log a critical warning to the Watchdog dashboard. High risk of context pollution.</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-[#30363d] rounded-md p-4 bg-gray-50 dark:bg-[#161b22] flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Slack Notification Webhook</h3>
                                        <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-0.5">Alert human operators when a mitigation action is taken.</p>
                                    </div>
                                    <ToggleSwitch checked={slackNotification} onChange={() => setSlackNotification(!slackNotification)} />
                                </div>
                            </div>
                        )}

                        {/* TAB: Golden Contexts */}
                        {activeTab === 'context' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pinned Golden Contexts</h2>
                                <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">Define explicit, unbreakable constraints that the Watchdog must evaluate against for <em>every</em> commit. These rules survive history rewrites and context truncation algorithms.</p>

                                <div className="border border-gray-200 dark:border-[#30363d] rounded-md overflow-hidden mb-4 shadow-sm">
                                    <div className="bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-4 py-2 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-[#8b949e] uppercase tracking-wide">Custom Rule JSON Array</span>
                                    </div>
                                    <textarea
                                        rows="8"
                                        value={goldenContextJSON}
                                        onChange={(e) => setGoldenContextJSON(e.target.value)}
                                        className="w-full p-4 text-sm font-mono bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:ring-0 resize-y border-none block"
                                        placeholder={`// Add your custom JSON or natural language constraints here\n{\n  'forbidden_tool_args': ['rm -rf', 'drop table'],\n  'required_output_format': 'json',\n  'mandatory_compliance': 'Never generate personally identifiable information (PII) in observation logs.'\n}`}
                                    ></textarea>
                                </div>
                                <button className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2">
                                    <i data-lucide="plus" className="w-4 h-4"></i> Add another rule block
                                </button>
                            </div>
                        )}

                    </section>
                </div>
            </main>
        </div>
    );
}
