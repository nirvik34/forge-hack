import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const [scrolled, setScrolled] = React.useState(false);
    const navigate = useNavigate();
    const [heroEmail, setHeroEmail] = React.useState('');

    // Refs for GSAP
    const mainRef = useRef();
    const heroBgRef = useRef();
    const terminalLinesRef = useRef([]);
    const featuresRef = useRef([]);
    const gitLinePathRef = useRef();

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useGSAP(() => {
        // 1. Parallax Background
        gsap.to(heroBgRef.current, {
            yPercent: 30,
            ease: "none",
            scrollTrigger: {
                trigger: mainRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        // 2. Staggered Terminal Entrance
        gsap.fromTo(terminalLinesRef.current,
            { opacity: 0, x: -20 },
            {
                opacity: 1,
                x: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "power2.out",
                delay: 0.5 // Wait for page load
            }
        );

        // 3. Staggered Features on Scroll
        featuresRef.current.forEach((feature, i) => {
            gsap.fromTo(feature,
                { opacity: 0, y: 100, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: feature,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // 4. Draw Git Line
        if (gitLinePathRef.current) {
            const length = gitLinePathRef.current.getTotalLength();
            gsap.set(gitLinePathRef.current, { strokeDasharray: length, strokeDashoffset: length });

            gsap.to(gitLinePathRef.current, {
                strokeDashoffset: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: ".features-container",
                    start: "top 50%",
                    end: "bottom 80%",
                    scrub: 1
                }
            });
        }
    }, { scope: mainRef });

    const addToTerminalLines = (el) => {
        if (el && !terminalLinesRef.current.includes(el)) {
            terminalLinesRef.current.push(el);
        }
    };

    const addToFeatures = (el) => {
        if (el && !featuresRef.current.includes(el)) {
            featuresRef.current.push(el);
        }
    };

    return (
        <div ref={mainRef} className="relative scroll-smooth bg-white dark:bg-[#0d1117] min-h-screen text-gray-900 dark:text-white overflow-hidden">
            <nav className={`fixed w-full z-50 transition-all duration-300 border-b border-white/10 ${scrolled ? 'bg-white dark:bg-[#0d1117]/80 backdrop-blur-xl shadow-lg' : 'bg-transparent border-transparent'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <i data-lucide="git-merge" className="w-5 h-5 text-black"></i>
                            </div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">CognitionVCS</span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition">Product <i data-lucide="chevron-down" className="inline w-3 h-3 ml-1"></i></a>
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition">Solutions <i data-lucide="chevron-down" className="inline w-3 h-3 ml-1"></i></a>
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition">Open Source</a>
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition">Pricing</a>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block relative">
                                <input type="text" placeholder="Search..." className="bg-white/5 border border-white/10 rounded-md pl-3 pr-8 py-1 text-sm text-gray-900 dark:text-white focus:border-white/30 focus:outline-none focus:ring-0 transition-colors w-48 backdrop-blur-md" />
                                <div className="absolute right-2 top-1.5 border border-white/20 rounded px-1 text-[10px] text-gray-400 font-mono">/</div>
                            </div>
                            <Link to="/login" className="text-sm font-medium hover:text-gray-900 dark:text-white transition text-gray-300">Sign in</Link>
                            <Link to="/signup" className="text-sm font-medium bg-white text-black hover:bg-gray-200 transition px-3 py-1.5 rounded-md">Sign up</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* FULL SCREEN HERO */}
            <div className="relative min-h-screen flex items-center justify-center pt-16 pb-20 overflow-hidden perspective-1000 border-b border-gray-200 dark:border-white/10">

                {/* Parallax Background */}
                <div ref={heroBgRef} className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] dark:mix-blend-screen"></div>
                    <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] dark:mix-blend-screen"></div>
                </div>

                {/* Smooth transition gradient to blend Hero and Features */}
                <div className="absolute bottom-0 left-0 right-0 h-[250px] bg-gradient-to-t from-white dark:from-[#0d1117] via-white/80 dark:via-[#0d1117]/80 to-transparent pointer-events-none z-10"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12 w-full">

                    {/* Hero Copy */}
                    <div className="w-full lg:w-[55%] pt-10">
                        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <span className="flex h-2 w-2 rounded-full bg-[#7ee787] shadow-[0_0_8px_#7ee787]"></span>
                            <span className="text-xs font-medium text-gray-300">Announcing Watchdog Overseer v1.0</span>
                        </div> */}

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
                            Where autonomous <br /> agents <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">think.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-500 dark:text-[#8b949e] font-light mb-8 max-w-2xl leading-relaxed">
                            The version control system for AI cognition. Track reasoning, branch thoughts, and rollback hallucinations instantly. Build agents that never lose their minds.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                navigate(`/signup?email=${encodeURIComponent(heroEmail)}`);
                            }} className="relative w-full sm:w-auto flex-grow max-w-sm">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={heroEmail}
                                    onChange={(e) => setHeroEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-md pl-4 pr-32 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                                <button type="submit" className="absolute right-1 top-1 bottom-1 bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] text-gray-900 dark:text-white font-semibold rounded px-4 transition shadow-[0_0_15px_rgba(35,134,54,0.3)]">
                                    Sign up for free
                                </button>
                            </form>
                            <button className="bg-transparent border border-white/20 hover:bg-white/5 px-6 py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition backdrop-blur-md">
                                Read the Docs <i data-lucide="arrow-right" className="w-4 h-4"></i>
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 border-l-2 border-white/10 pl-4">
                            Trusted by developers building reliable multi-agent systems. <br />
                            Compatible with <span className="text-gray-300 font-medium">LangChain</span>, <span className="text-gray-300 font-medium">AutoGen</span>, and <span className="text-gray-300 font-medium">CrewAI</span>.
                        </p>
                    </div>

                    {/* Hero Visual (3D Isometric Terminal) */}
                    <div className="w-full lg:w-[45%] relative z-20">
                        {/* Isometric Transform Wrapper */}
                        <div className="relative w-full" style={{ transform: 'perspective(1200px) rotateX(15deg) rotateY(-20deg) rotateZ(5deg)', transformStyle: 'preserve-3d' }}>

                            {/* Deep glowing shadow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-2xl opacity-30 transform translate-y-10 translate-x-5"></div>

                            {/* Glassmorphic Terminal */}
                            <div className="relative bg-white dark:bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
                                <div className="bg-white dark:bg-[#0d1117]/80 border-b border-white/10 px-4 py-3 flex items-center gap-2 backdrop-blur-md">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                    <span className="ml-2 text-xs text-gray-400 font-mono">agent_terminal ~ cvc log</span>
                                </div>

                                <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-hidden">
                                    <div ref={addToTerminalLines} className="text-gray-500 dark:text-[#8b949e]">$ cvc commit -m "Attempting to scrape financial data"</div>
                                    <div ref={addToTerminalLines} className="text-gray-300 mt-1">[main <span className="text-blue-600 dark:text-[#58a6ff]">e4a2b91</span>] Snapshot compressed.</div>
                                    <div ref={addToTerminalLines} className="text-[#7ee787] mt-1 drop-shadow-[0_0_5px_rgba(126,231,135,0.5)]">✓ Observation hashed: SHA-256</div>

                                    <div ref={addToTerminalLines} className="text-gray-500 dark:text-[#8b949e] mt-5">$ cvc status</div>
                                    <div ref={addToTerminalLines} className="text-gray-300 mt-1">Agent on branch main.</div>
                                    <div ref={addToTerminalLines} className="text-red-600 dark:text-[#ff7b72] mt-1 font-bold drop-shadow-[0_0_5px_rgba(255,123,114,0.5)]">🚨 WATCHDOG ALERT: Hallucination detected in internal prompt.</div>
                                    <div ref={addToTerminalLines} className="text-gray-500 dark:text-[#8b949e] ml-4">↳ Reason: Agent fabricated Q3 earnings data.</div>

                                    <div ref={addToTerminalLines} className="text-gray-500 dark:text-[#8b949e] mt-5">$ cvc reset --hard HEAD~1</div>
                                    <div ref={addToTerminalLines} className="text-gray-300 mt-1">HEAD is now at <span className="text-blue-600 dark:text-[#58a6ff]">f19c0a2</span> (Stable initial state)</div>
                                    <div ref={addToTerminalLines} className="text-[#d2a8ff] mt-1 drop-shadow-[0_0_5px_rgba(210,168,255,0.5)]">✨ Context memory restored. Ready for retry.</div>

                                    <div ref={addToTerminalLines} className="mt-5 flex items-center">
                                        <span className="text-[#238636]">agent@local</span><span className="text-gray-900 dark:text-white">:</span><span className="text-blue-600 dark:text-[#58a6ff]">~/memory</span><span className="text-gray-900 dark:text-white">$ </span><span className="w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating isometric element */}
                            <div className="absolute -right-12 -bottom-12 bg-white dark:bg-[#0d1117]/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-2xl flex items-center gap-3 transform translate-z-[50px]">
                                <div className="w-10 h-10 rounded-full border border-[#238636] flex items-center justify-center bg-green-600 dark:bg-[#238636]/20">
                                    <i data-lucide="git-commit-vertical" className="w-5 h-5 text-[#7ee787]"></i>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Merged PR <span className="font-mono text-blue-600 dark:text-[#58a6ff]">#42</span></div>
                                    <div className="text-sm text-white font-medium">Research path verified</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FEATURES SECTION WITH SVG LINE */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative features-container">
                {/* Ambient Background Glows for smooth section transitions */}
                <div className="absolute -top-10 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] dark:mix-blend-screen pointer-events-none"></div>
                <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-[130px] dark:mix-blend-screen pointer-events-none"></div>

                {/* SVG Animated Git Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-2 md:-translate-x-1/2 z-0 hidden md:block">
                    <svg width="4" height="100%" className="absolute left-1/2 -translate-x-1/2 overflow-visible">
                        <line x1="2" y1="0" x2="2" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                        <line
                            ref={gitLinePathRef}
                            x1="2" y1="0" x2="2" y2="100%"
                            stroke="url(#gradient)"
                            strokeWidth="3"
                            className="drop-shadow-[0_0_10px_rgba(88,166,255,0.8)]"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#58a6ff" />
                                <stop offset="50%" stopColor="#3fb950" />
                                <stop offset="100%" stopColor="#8957e5" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Feature 1 */}
                <div ref={addToFeatures} className="relative z-10 mb-48 flex flex-col md:flex-row gap-12 items-center">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-[#0d1117] border-4 border-blue-600 dark:border-[#58a6ff] rounded-full hidden md:block shadow-[0_0_15px_rgba(88,166,255,0.5)] z-20"></div>

                    <div className="w-full md:w-1/2 md:pr-16 text-left md:text-right">
                        <h2 className="text-blue-600 dark:text-[#58a6ff] font-medium text-lg mb-2 flex items-center md:justify-end gap-2 drop-shadow-[0_0_8px_rgba(88,166,255,0.5)]">
                            <i data-lucide="box" className="w-5 h-5"></i> Compressed State
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Immutable cognitive <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">commits.</span></h3>
                        <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                            Every agent action, thought, and observation is hashed and compressed into an atomic commit. Map the entire reasoning lineage of your LLM without destroying your context window.
                        </p>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="p-1 rounded-2xl bg-gradient-to-br from-[#58a6ff]/30 to-transparent">
                            <div className="p-6 bg-white dark:bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl relative shadow-2xl">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src="https://ui-avatars.com/api/?name=Agent&background=0D8ABC&color=fff&size=32" className="rounded-full ring-2 ring-white/10" alt="Agent" />
                                        <div>
                                            <div className="text-sm text-white font-medium">ResearchAgent</div>
                                            <div className="text-xs text-gray-400">Committed 2 mins ago</div>
                                        </div>
                                    </div>
                                    <span className="font-mono text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">e4a2b91</span>
                                </div>
                                <div className="space-y-3 font-mono text-sm">
                                    <div className="flex gap-4"><span className="text-red-600 dark:text-[#ff7b72]">-</span> <span className="text-gray-500 line-through">Prompt: Search web for "Tesla stock price"</span></div>
                                    <div className="flex gap-4"><span className="text-[#7ee787]">+</span> <span className="text-gray-200">Prompt: Query YahooFinance tool for ticker 'TSLA'</span></div>
                                    <div className="flex gap-4"><span className="text-[#7ee787]">+</span> <span className="text-blue-600 dark:text-[#58a6ff]">Action: ToolExecution(YahooFinance)</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2 */}
                <div ref={addToFeatures} className="relative z-10 mb-48 flex flex-col md:flex-row-reverse gap-12 items-center">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-[#0d1117] border-4 border-green-600 dark:border-[#3fb950] rounded-full hidden md:block shadow-[0_0_15px_rgba(63,185,80,0.5)] z-20"></div>

                    <div className="w-full md:w-1/2 md:pl-16">
                        <h2 className="text-green-600 dark:text-[#3fb950] font-medium text-lg mb-2 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(63,185,80,0.5)]">
                            <i data-lucide="shield-alert" className="w-5 h-5"></i> Anti-Virus for Agents
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Self-healing <br />reasoning.</h3>
                        <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                            Say goodbye to compounding errors. The fine-tuned Overseer LLM scans every proposed commit. If it detects a hallucination, logic gap, or endless loop, it blocks the commit and forces a deterministic rollback.
                        </p>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#3fb950]/30 to-transparent">
                            <div className="bg-white dark:bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 text-red-600 dark:text-[#ff7b72] text-sm font-bold uppercase mb-4 tracking-wider drop-shadow-[0_0_5px_rgba(255,123,114,0.5)]">
                                    <i data-lucide="shield-x" className="w-5 h-5"></i> Intercepted by Watchdog
                                </div>
                                <div className="bg-black/40 rounded p-4 text-sm text-gray-300 mb-4 border border-white/5">
                                    "Based on the tool search, Tesla's stock price today is <span className="bg-red-500/20 text-red-300 px-1 rounded">$14,000</span> per share."
                                </div>
                                <div className="text-xs text-gray-400 mb-4 font-mono border-l-2 border-gray-200 dark:border-[#30363d] pl-3">
                                    Overseer Analysis: Agent misinterpreted market cap data as share price. Severe numeric hallucination detected.
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button className="bg-white/10 border border-white/10 text-gray-900 dark:text-white text-xs px-4 py-2 rounded-md font-medium hover:bg-white/20 transition">View Context</button>
                                    <button className="bg-[#ff7b72]/10 border border-red-600 dark:border-[#ff7b72]/30 text-red-600 dark:text-[#ff7b72] text-xs px-4 py-2 rounded-md font-medium flex items-center gap-1 shadow-[0_0_10px_rgba(255,123,114,0.1)]">
                                        <i data-lucide="rotate-ccw" className="w-3 h-3"></i> Auto-Rollback Executed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* CTA SECTION */}
            <div className="relative overflow-hidden py-32 border-t border-white/10 bg-black/50">
                <div className="absolute inset-0 z-0">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/10 rounded-t-full blur-[100px]"></div>
                </div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">Deploy reliable agents today.</h2>
                    <p className="text-xl text-gray-400 font-light mb-10 max-w-2xl mx-auto">
                        Join the platform where developers orchestrate the next generation of autonomous AI without losing their minds.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/signup" className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] text-gray-900 dark:text-white font-semibold rounded-md px-8 py-4 text-lg transition shadow-[0_0_20px_rgba(35,134,54,0.4)]">
                            Get started for free
                        </Link>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-gray-50 dark:bg-[#010409] pt-16 pb-8 border-t border-white/10 text-sm text-gray-400 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                        <div className="flex items-center gap-3">
                            <i data-lucide="git-merge" className="w-6 h-6 text-gray-400"></i>
                            <span className="font-bold text-gray-900 dark:text-white tracking-tight text-xl">CognitionVCS</span>
                        </div>
                        <div className="flex gap-6">
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition"><i data-lucide="twitter" className="w-5 h-5"></i></a>
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition"><i data-lucide="github" className="w-5 h-5"></i></a>
                            <a href="#!" className="hover:text-gray-900 dark:text-white transition"><i data-lucide="linkedin" className="w-5 h-5"></i></a>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs border-t border-white/10 pt-8">
                        <div>© 2026 CognitionVCS, Inc. Built for the Hackathon.</div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-green-600 dark:bg-[#238636] shadow-[0_0_8px_#238636]"></span>
                            All systems operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
