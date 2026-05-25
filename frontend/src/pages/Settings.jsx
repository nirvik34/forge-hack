import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Navbar from '../components/Navbar';
import axios from 'axios';

export default function Settings() {
    const mainRef = useRef(null);
    const staggerItemsRef = useRef([]);
    const fileInputRef = useRef(null);

    // Active Sidebar Tab State
    const [activeTab, setActiveTab] = useState('profile');

    // User Settings State (synchronized with backend)
    const [settings, setSettings] = useState({
        name: "Nirvik Dev",
        username: "nirvik-dev",
        email: "nirvik@cognitionvcs.ai",
        bio: "Researching multi-agent VCS structures.",
        url: "https://cognitionvcs.ai",
        company: "Autonomous Systems Lab",
        location: "San Francisco, CA",
        avatar: "https://ui-avatars.com/api/?name=Nirvik+Dev&background=0D8ABC&color=fff&size=200",
        gemini_key: "AIzaSyB-H8_9kLm3_v002_d4735304",
        openai_key: "sk-proj-LL87x291vLa9qM0",
        github_connected: true,
        slack_connected: false,
        cli_tokens: [
            {
                description: "cvc-cli-session-office",
                token: "cvc_pat_e8d5f4c2c9d1a3b8d4c5",
                created_at: "May 19, 2026",
                last_used: "May 20, 2026"
            }
        ],
        subscription_plan: "Free Tier",
        token_quota_used: 1.2,
        token_quota_total: 5.0
    });

    // Temp Form States
    const [nameInput, setNameInput] = useState(settings.name);
    const [emailInput, setEmailInput] = useState(settings.email);
    const [bioInput, setBioInput] = useState(settings.bio);
    const [urlInput, setUrlInput] = useState(settings.url);
    const [companyInput, setCompanyInput] = useState(settings.company);
    const [locationInput, setLocationInput] = useState(settings.location);
    const [usernameInput, setUsernameInput] = useState(settings.username);
    const [geminiKeyInput, setGeminiKeyInput] = useState(settings.gemini_key);
    const [openaiKeyInput, setOpenaiKeyInput] = useState(settings.openai_key);
    const [tokenDescInput, setTokenDescInput] = useState("");

    // UI Visibilities
    const [showGemini, setShowGemini] = useState(false);
    const [showOpenai, setShowOpenai] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Generated PAT details
    const [generatedToken, setGeneratedToken] = useState("");
    const [showTokenBox, setShowTokenBox] = useState(false);

    // Toast Notification Details
    const [toast, setToast] = useState({ show: false, message: "", color: "green" });

    // Fetch initial settings from backend
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/settings`)
            .then(res => {
                if (res.data && res.data.status === "success") {
                    const data = res.data.data;
                    setSettings(data);
                    setNameInput(data.name || "");
                    setEmailInput(data.email || "");
                    setBioInput(data.bio || "");
                    setUrlInput(data.url || "");
                    setCompanyInput(data.company || "");
                    setLocationInput(data.location || "");
                    setUsernameInput(data.username || "");
                    setGeminiKeyInput(data.gemini_key || "");
                    setOpenaiKeyInput(data.openai_key || "");
                }
            })
            .catch(err => {
                console.error("Error fetching settings:", err);
            });
    }, []);

    // Re-render Lucide icons on tab/state modifications
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeTab, settings, showGemini, showOpenai, showUpgradeModal, showTokenBox, toast]);

    const addToStagger = (el) => {
        if (el && !staggerItemsRef.current.includes(el)) {
            staggerItemsRef.current.push(el);
        }
    };

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

    // Toast alert helper
    const triggerToast = (message, color = "green") => {
        setToast({ show: true, message, color });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Update settings via backend API
    const updateBackendSettings = (updatedPayload) => {
        axios.post('http://localhost:8000/settings/update', updatedPayload)
            .then(res => {
                if (res.data && res.data.status === "success") {
                    setSettings(res.data.data);
                }
            })
            .catch(err => {
                console.error("Error updating settings:", err);
            });
    };

    // Form Submissions
    const handleUpdateProfile = () => {
        const payload = {
            name: nameInput,
            email: emailInput,
            bio: bioInput,
            url: urlInput,
            company: companyInput,
            location: locationInput
        };
        updateBackendSettings(payload);
        triggerToast("Public profile settings saved successfully!", "green");
    };

    const handleUpdateUsername = () => {
        if (!usernameInput.trim()) {
            triggerToast("Username cannot be empty.", "red");
            return;
        }
        updateBackendSettings({ username: usernameInput });
        triggerToast(`Username updated to ${usernameInput}!`, "green");
    };

    const handleSaveApiKey = (provider, keyVal) => {
        const keyField = provider === "Gemini" ? "gemini_key" : "openai_key";
        updateBackendSettings({ [keyField]: keyVal });
        triggerToast(`${provider} API credential updated successfully!`, "green");
    };

    const handleToggleIntegration = (platform, currentStatus) => {
        const keyField = platform === "GitHub" ? "github_connected" : "slack_connected";
        const newStatus = !currentStatus;
        updateBackendSettings({ [keyField]: newStatus });
        triggerToast(newStatus ? `Connected to ${platform}` : `Disconnected from ${platform}`, newStatus ? "green" : "red");
    };

    // Avatar Upload (FileReader & backend sync)
    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target.result;
                updateBackendSettings({ avatar: base64Url });
                triggerToast("Profile picture updated!", "green");
            };
            reader.readAsDataURL(file);
        }
    };

    // CLI Access Tokens
    const handleGenerateCLIToken = () => {
        if (!tokenDescInput.trim()) {
            triggerToast("Please provide a token description first.", "red");
            return;
        }
        const tokenString = "cvc_pat_" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const newToken = {
            description: tokenDescInput,
            token: tokenString,
            created_at: "May 20, 2026",
            last_used: "Never"
        };
        const updatedTokens = [...settings.cli_tokens, newToken];
        updateBackendSettings({ cli_tokens: updatedTokens });
        setGeneratedToken(tokenString);
        setShowTokenBox(true);
        setTokenDescInput("");
        triggerToast("Token generated successfully!", "green");
    };

    const handleRevokeToken = (indexToRevoke) => {
        const updatedTokens = settings.cli_tokens.filter((_, idx) => idx !== indexToRevoke);
        updateBackendSettings({ cli_tokens: updatedTokens });
        triggerToast("CLI Access Token revoked successfully.", "red");
    };

    const executeUpgrade = () => {
        updateBackendSettings({
            subscription_plan: "Teams Tier",
            token_quota_total: 10.0
        });
        setShowUpgradeModal(false);
        triggerToast("Successfully upgraded to the Teams Plan!", "indigo");
    };

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
            {/* Reusable Global Navbar */}
            <Navbar />

            {/* Custom Toast alert */}
            <div className={`fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 transform transition-all duration-300 z-50 text-sm ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <span className={toast.color === "green" ? "text-emerald-400" : toast.color === "indigo" ? "text-indigo-400" : "text-red-500"}>●</span>
                <span>{toast.message}</span>
            </div>

            {/* Upgrade Subscription Plan Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl border border-gray-200 dark:border-[#30363d] max-w-md w-full p-6 animate-scale-up text-gray-900 dark:text-[#c9d1d9]">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-[#30363d] mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upgrade to Teams Plan</h3>
                            <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <i data-lucide="x" className="w-5 h-5"></i>
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">Unlock parallel agent executions, collaborative merging, and high-frequency watchdog scanning.</p>
                        <div className="bg-slate-50 dark:bg-[#0d1117] p-4 rounded-md border border-gray-200 dark:border-[#30363d] mb-4">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="font-bold text-slate-800 dark:text-white text-xl">$49<span className="text-xs font-normal text-gray-500">/mo</span></span>
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded">Popular</span>
                            </div>
                            <ul className="text-xs text-slate-600 dark:text-[#8b949e] space-y-2 mt-2">
                                <li className="flex items-center gap-1.5"><i data-lucide="check" className="w-3.5 h-3.5 text-green-600 dark:text-[#3fb950]"></i> Up to 15 concurrent agents</li>
                                <li className="flex items-center gap-1.5"><i data-lucide="check" className="w-3.5 h-3.5 text-green-600 dark:text-[#3fb950]"></i> Real-time Merkle-DAG branch merges</li>
                                <li className="flex items-center gap-1.5"><i data-lucide="check" className="w-3.5 h-3.5 text-green-600 dark:text-[#3fb950]"></i> 10M API token pool included</li>
                            </ul>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowUpgradeModal(false)} className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-4 py-1.5 rounded text-sm font-medium">Cancel</button>
                            <button onClick={executeUpgrade} className="bg-[#1f883d] hover:bg-[#1a7f37] text-white border border-transparent px-4 py-1.5 rounded text-sm font-medium">Activate Teams Plan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Settings Container (Master-Detail Structure) */}
            <main className="flex-grow w-full max-w-[1024px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">

                {/* Sidebar Navigation */}
                <aside className="w-full md:w-1/4 flex flex-col gap-1">
                    <div className="mb-4 px-4 flex items-center gap-3">
                        <img src={settings.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#30363d] object-cover" />
                        <div>
                            <div className="font-bold text-sm leading-tight text-gray-900 dark:text-white truncate w-36">{settings.name}</div>
                            <div className="text-xs text-gray-500 dark:text-[#8b949e]">Personal Account</div>
                        </div>
                    </div>

                    <nav className="flex flex-col space-y-1">
                        <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition ${activeTab === 'profile' ? 'font-semibold bg-gray-100 dark:bg-[#161b22] text-gray-900 dark:text-white border-l-3 border-[#fd8c73]' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#161b22]/50'}`} onClick={() => setActiveTab('profile')}>
                            <i data-lucide="user" className="w-4 h-4"></i> Public profile
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition ${activeTab === 'account' ? 'font-semibold bg-gray-100 dark:bg-[#161b22] text-gray-900 dark:text-white border-l-3 border-[#fd8c73]' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#161b22]/50'}`} onClick={() => setActiveTab('account')}>
                            <i data-lucide="settings" className="w-4 h-4"></i> Account settings
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition ${activeTab === 'connectors' ? 'font-semibold bg-gray-100 dark:bg-[#161b22] text-gray-900 dark:text-white border-l-3 border-[#fd8c73]' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#161b22]/50'}`} onClick={() => setActiveTab('connectors')}>
                            <i data-lucide="plug" className="w-4 h-4"></i> Connectors & API
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition ${activeTab === 'security' ? 'font-semibold bg-gray-100 dark:bg-[#161b22] text-gray-900 dark:text-white border-l-3 border-[#fd8c73]' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#161b22]/50'}`} onClick={() => setActiveTab('security')}>
                            <i data-lucide="shield-check" className="w-4 h-4"></i> Security & Access
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md cursor-pointer transition ${activeTab === 'billing' ? 'font-semibold bg-gray-100 dark:bg-[#161b22] text-gray-900 dark:text-white border-l-3 border-[#fd8c73]' : 'text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#161b22]/50'}`} onClick={() => setActiveTab('billing')}>
                            <i data-lucide="credit-card" className="w-4 h-4"></i> Billing & Plans
                        </div>
                    </nav>
                </aside>

                {/* Right Content Section */}
                <section className="w-full md:w-3/4 pb-12">

                    {/* VIEW 1: Public Profile */}
                    {activeTab === 'profile' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-[#30363d] pb-2">Public profile</h2>

                            <div className="flex flex-col-reverse md:flex-row gap-8 mt-6">
                                <div className="w-full md:w-2/3 flex flex-col gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-[#c9d1d9] mb-1">Display Name</label>
                                        <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">This will display to your team and collaborators during active agent merges.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-[#c9d1d9] mb-1">Public Email</label>
                                        <select value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full cursor-pointer">
                                            <option value="nirvik@cognitionvcs.ai">nirvik@cognitionvcs.ai</option>
                                            <option value="keep-my-email-private@cognitionvcs.ai">keep-my-email-private@cognitionvcs.ai</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-[#c9d1d9] mb-1">Bio</label>
                                        <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} rows="3" className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" placeholder="Tell us about your multi-agent architecture setup..."></textarea>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-[#30363d] pt-5 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Metadata Connections</h3>
                                        <div className="flex items-center gap-2">
                                            <i data-lucide="link" className="w-4 h-4 text-gray-500 flex-shrink-0"></i>
                                            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://cognitionvcs.ai" className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <i data-lucide="building" className="w-4 h-4 text-gray-500 flex-shrink-0"></i>
                                            <input type="text" value={companyInput} onChange={(e) => setCompanyInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <i data-lucide="map-pin" className="w-4 h-4 text-gray-500 flex-shrink-0"></i>
                                            <input type="text" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button onClick={handleUpdateProfile} className="bg-[#1f883d] hover:bg-[#1a7f37] text-white border border-transparent px-4 py-1.5 rounded text-sm font-medium transition">Update profile</button>
                                    </div>
                                </div>

                                {/* Profile Picture Column */}
                                <div className="w-full md:w-1/3 flex flex-col items-center md:items-start">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-[#c9d1d9] mb-2">Profile picture</label>
                                    <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current.click()}>
                                        <img src={settings.avatar} alt="Profile Picture" className="w-48 h-48 rounded-full border border-gray-200 dark:border-[#30363d] shadow-sm object-cover" />
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="text-white flex flex-col items-center text-xs">
                                                <i data-lucide="camera" className="w-6 h-6 mb-1"></i>
                                                <span className="font-semibold">Upload Photo</span>
                                            </div>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                    <div className="flex gap-2 w-48">
                                        <button className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] w-full py-1 text-xs rounded transition" onClick={() => fileInputRef.current.click()}>Upload new image</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: Account Settings */}
                    {activeTab === 'account' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-[#30363d] pb-2">Account Settings</h2>

                            <div className="flex flex-col gap-6 mt-6">
                                <div>
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2">Change Username</h3>
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full md:w-1/2" />
                                        <button onClick={handleUpdateUsername} className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1.5 rounded transition">Save</button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">This will change the URLs of all your cognitive repositories.</p>
                                </div>

                                <div className="border-t border-gray-200 dark:border-[#30363d] pt-6">
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2">Export Cognitive History</h3>
                                    <p class="text-sm text-gray-600 dark:text-[#8b949e] mb-3">Download a ZIP containing all episodic, semantic, and procedural commits across all repositories as structured JSON metadata.</p>
                                    <button onClick={() => triggerToast("Cognitive data collection started in the background. Check email soon.", "indigo")} className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-4 py-1.5 rounded text-sm flex items-center gap-2 transition">
                                        <i data-lucide="download" className="w-4 h-4"></i> Start Export
                                    </button>
                                </div>

                                <div className="border-t border-red-200 dark:border-red-900/50 pt-6 mt-6">
                                    <h3 className="text-md font-bold text-red-600 dark:text-[#ff7b72] mb-2">Danger Zone</h3>
                                    <div className="border border-red-200 dark:border-red-950 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Delete Account and Agent Repositories</h4>
                                            <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Permanently erase all hashed memory trunks, commit chains, and security logs. This is irreversible.</p>
                                        </div>
                                        <button onClick={() => triggerToast("Account deletion requires confirmation. This action has been logged.", "red")} className="border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 text-red-600 font-medium px-4 py-1.5 rounded text-sm transition flex-shrink-0">Delete Account</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 3: Connectors & API Keys */}
                    {activeTab === 'connectors' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-[#30363d] pb-2">Connectors & API Keys</h2>
                            <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-6">Equip your cognitive models with primary credentials for tool calls, database operations, and watchdogs.</p>

                            {/* Model Keys */}
                            <div className="mb-8">
                                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Language Model API Connections</h3>
                                <div className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-[#30363d]">

                                    {/* Gemini API Connection */}
                                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-[#161b22]/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                                                <i data-lucide="sparkles" className="w-6 h-6 text-indigo-600 dark:text-[#a371f7]"></i>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Google Gemini API</h4>
                                                <p className="text-xs text-gray-500 dark:text-[#8b949e]">Powers continuous factual validation and Watchdog Anti-Virus operations.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <div className="relative w-full md:w-60">
                                                <input type={showGemini ? "text" : "password"} value={geminiKeyInput} onChange={(e) => setGeminiKeyInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md pl-3 pr-10 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full font-mono" />
                                                <button onClick={() => setShowGemini(!showGemini)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                                    <i data-lucide={showGemini ? "eye-off" : "eye"} className="w-4 h-4"></i>
                                                </button>
                                            </div>
                                            <button onClick={() => handleSaveApiKey("Gemini", geminiKeyInput)} className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1.5 rounded transition">Save</button>
                                        </div>
                                    </div>

                                    {/* OpenAI API Connection */}
                                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-slate-900 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                                                <i data-lucide="cpu" className="w-6 h-6 text-emerald-400"></i>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">OpenAI Platform</h4>
                                                <p className="text-xs text-gray-500 dark:text-[#8b949e]">Enables secondary processing of semantic knowledge embeddings.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <div className="relative w-full md:w-60">
                                                <input type={showOpenai ? "text" : "password"} value={openaiKeyInput} onChange={(e) => setOpenaiKeyInput(e.target.value)} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md pl-3 pr-10 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full font-mono" />
                                                <button onClick={() => setShowOpenai(!showOpenai)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                                    <i data-lucide={showOpenai ? "eye-off" : "eye"} className="w-4 h-4"></i>
                                                </button>
                                            </div>
                                            <button onClick={() => handleSaveApiKey("OpenAI", openaiKeyInput)} className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1.5 rounded transition">Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Webhooks & Integrations */}
                            <div>
                                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Watchdog Alert Targets</h3>
                                <div className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-[#30363d]">
                                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-[#161b22]/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-[#24292f] dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] flex items-center justify-center shadow-sm flex-shrink-0">
                                                <i data-lucide="github" className="w-6 h-6 text-white"></i>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">GitHub Commit Sync</h4>
                                                <p className="text-xs text-gray-500 dark:text-[#8b949e]">Connected to <strong className="font-mono text-xs">@{settings.username}</strong>. Exports verified logic as code.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleIntegration('GitHub', settings.github_connected)} className={`px-3 py-1.5 rounded text-sm font-medium transition ${settings.github_connected ? 'bg-red-50 hover:bg-red-600 hover:text-white text-red-600' : 'bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9]'}`}>
                                            {settings.github_connected ? "Disconnect" : "Connect"}
                                        </button>
                                    </div>

                                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] flex items-center justify-center shadow-sm flex-shrink-0">
                                                <i data-lucide="message-square" className="w-6 h-6 text-[#E01E5A]"></i>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Slack Anomaly Channel</h4>
                                                <p className="text-xs text-gray-500 dark:text-[#8b949e]">Forwards critical hallucination warnings to security channels instantly.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleIntegration('Slack', settings.slack_connected)} className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1 ${settings.slack_connected ? 'bg-red-50 hover:bg-red-600 hover:text-white text-red-600' : 'bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-[#c9d1d9]'}`}>
                                            {!settings.slack_connected && <i data-lucide="plus" className="w-4 h-4"></i>}
                                            {settings.slack_connected ? "Disconnect" : "Connect Slack"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 4: Security & Access */}
                    {activeTab === 'security' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-[#30363d] pb-2">Security & Access</h2>

                            <div className="flex flex-col gap-6 mt-6">
                                {/* CLI Tokens */}
                                <div>
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-1">CLI Personal Access Tokens</h3>
                                    <p className="text-sm text-gray-600 dark:text-[#8b949e] mb-4">Generate and configure secure credentials to authenticate the <strong className="font-mono text-xs">cvc</strong> command-line terminal tool with your remote repositories.</p>

                                    <div className="bg-slate-50 dark:bg-[#161b22]/30 border border-gray-200 dark:border-[#30363d] rounded-lg p-4 mb-4">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wide mb-3">Generate New Token</h4>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" value={tokenDescInput} onChange={(e) => setTokenDescInput(e.target.value)} placeholder="Token description (e.g., Mac Terminal)" className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] flex-grow" />
                                            <button onClick={handleGenerateCLIToken} className="bg-[#1f883d] hover:bg-[#1a7f37] text-white border border-transparent px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap flex items-center gap-1">
                                                <i data-lucide="key" className="w-4 h-4"></i> Generate Token
                                            </button>
                                        </div>
                                    </div>

                                    {/* Generated token box */}
                                    {showTokenBox && (
                                        <div className="border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 mb-4">
                                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-2">
                                                <i data-lucide="check-circle" className="w-4 h-4"></i> Copy this token now! You won't be able to see it again.
                                            </span>
                                            <div className="flex gap-2">
                                                <input type="text" value={generatedToken} readOnly className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-xs text-gray-800 dark:text-white flex-grow font-mono" />
                                                <button onClick={() => {
                                                    navigator.clipboard.writeText(generatedToken);
                                                    triggerToast("Copied to clipboard!", "green");
                                                }} className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1.5 rounded text-xs flex items-center gap-1.5">
                                                    <i data-lucide="copy" className="w-4 h-4"></i> Copy
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Token List */}
                                    <div className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-[#30363d]">
                                        {settings.cli_tokens.map((tokenObj, idx) => (
                                            <div key={idx} className="p-4 flex justify-between items-center bg-gray-50/50 dark:bg-[#161b22]/30">
                                                <div>
                                                    <span className="font-semibold text-sm text-slate-800 dark:text-white">{tokenObj.description}</span>
                                                    <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Generated {tokenObj.created_at} • Last used {tokenObj.last_used}</div>
                                                </div>
                                                <button onClick={() => handleRevokeToken(idx)} className="border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 text-red-600 px-3 py-1 rounded text-xs font-semibold transition">Revoke</button>
                                            </div>
                                        ))}
                                        {settings.cli_tokens.length === 0 && (
                                            <div className="p-8 text-center text-sm text-gray-500 dark:text-[#8b949e]">
                                                No CLI access tokens generated yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Change Password */}
                                <div className="border-t border-gray-200 dark:border-[#30363d] pt-6">
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Update Password</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Current Password</label>
                                            <input type="password" className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        </div>
                                        <div></div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">New Password</label>
                                            <input type="password" className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Confirm Password</label>
                                            <input type="password" className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff] w-full" />
                                        </div>
                                    </div>
                                    <button onClick={() => triggerToast("Account security credentials successfully updated.", "green")} className="bg-[#1f883d] hover:bg-[#1a7f37] text-white border border-transparent px-4 py-1.5 rounded text-sm font-medium mt-4 transition">Save Password</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 5: Billing & Plans */}
                    {activeTab === 'billing' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-[#30363d] pb-2">Billing & Plans</h2>

                            <div className="flex flex-col gap-6 mt-6">
                                {/* Active Subscription Summary */}
                                <div className="border border-gray-200 dark:border-[#30363d] rounded-lg p-5 bg-slate-50 dark:bg-[#161b22]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Current Plan</span>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{settings.subscription_plan}</h3>
                                        <p className="text-sm text-gray-600 dark:text-[#8b949e] mt-1">Perfect for local research and single-agent execution pipelines.</p>
                                    </div>
                                    {settings.subscription_plan === "Free Tier" && (
                                        <button onClick={() => setShowUpgradeModal(true)} className="bg-[#1f883d] hover:bg-[#1a7f37] text-white border border-transparent px-4 py-2 rounded text-sm font-medium flex items-center gap-1.5 transition">
                                            <i data-lucide="zap" className="w-4 h-4"></i> Upgrade Plan
                                        </button>
                                    )}
                                </div>

                                {/* Usage Stats */}
                                <div>
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Resource Quota Allocation</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="border border-gray-200 dark:border-[#30363d] rounded-lg p-4 bg-white dark:bg-[#161b22]">
                                            <div className="flex justify-between items-center text-xs mb-2">
                                                <span className="font-medium text-gray-600 dark:text-[#8b949e]">API Tokens (Gemini/OpenAI)</span>
                                                <span className="font-bold text-slate-800 dark:text-white">{settings.token_quota_used}M / {settings.token_quota_total}M</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-[#30363d] h-2 rounded-full">
                                                <div className="bg-indigo-600 dark:bg-[#a371f7] h-2 rounded-full" style={{ width: `${(settings.token_quota_used / settings.token_quota_total) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="border border-gray-200 dark:border-[#30363d] rounded-lg p-4 bg-white dark:bg-[#161b22]">
                                            <div className="flex justify-between items-center text-xs mb-2">
                                                <span className="font-medium text-gray-600 dark:text-[#8b949e]">Storage / Compressed Memory</span>
                                                <span className="font-bold text-slate-800 dark:text-white">45MB / 500MB</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-[#30363d] h-2 rounded-full">
                                                <div className="bg-emerald-500 dark:bg-[#3fb950] h-2 rounded-full" style={{ width: '9%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction History */}
                                <div className="border-t border-gray-200 dark:border-[#30363d] pt-6">
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Invoices & Receipts</h3>
                                    <div className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-xs text-gray-600 dark:text-[#c9d1d9] border-collapse">
                                            <thead className="bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] font-semibold text-gray-500 dark:text-[#8b949e] uppercase">
                                                <tr>
                                                    <th className="px-4 py-3">Invoice Number</th>
                                                    <th className="px-4 py-3">Billing Date</th>
                                                    <th className="px-4 py-3">Plan Details</th>
                                                    <th className="px-4 py-3 text-right">Amount Paid</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-[#30363d]">
                                                <tr>
                                                    <td className="px-4 py-3 font-mono">INV-2026-004</td>
                                                    <td className="px-4 py-3">May 1, 2026</td>
                                                    <td className="px-4 py-3">Free Tier • Token Overages</td>
                                                    <td className="px-4 py-3 text-right font-semibold">$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-mono">INV-2026-003</td>
                                                    <td className="px-4 py-3">Apr 1, 2026</td>
                                                    <td className="px-4 py-3">Free Tier • Token Overages</td>
                                                    <td className="px-4 py-3 text-right font-semibold">$0.00</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </section>
            </main>
        </div>
    );
}
