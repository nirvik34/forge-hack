import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function NewRepo() {
    const [repoName, setRepoName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState('public');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
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
        onSuccess: () => {
            // Invalidate the agents query to fetch the new list
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            navigate('/dashboard');
        },
    });

    useGSAP(() => {
        
        
        gsap.fromTo('.animate-in', 
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out' }
        );
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!repoName.trim()) return;
        
        mutation.mutate({
            org: 'ai-org', // Hardcoded owner for demo
            name: repoName.toLowerCase().replace(/\s+/g, '-'),
            description: description
        });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9] font-sans pb-20">
            {/* Header */}
            <header className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] px-6 py-4 flex items-center gap-4">
                <Link to="/dashboard" className="text-gray-900 dark:text-[#c9d1d9] hover:text-blue-600 dark:text-[#58a6ff]">
                    <i data-lucide="git-merge" className="w-6 h-6"></i>
                </Link>
                <div className="font-semibold text-sm">Create a new cognitive repository</div>
            </header>

            <main className="max-w-[768px] mx-auto mt-10 px-4">
                <div className="animate-in border-b border-gray-200 dark:border-[#30363d] pb-6 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create a new cognitive repository</h1>
                    <p className="text-sm text-gray-500 dark:text-[#8b949e]">A cognitive repository contains an agent's memory tree, tools, and execution history.</p>
                </div>

                <form onSubmit={handleSubmit} className="animate-in space-y-6">
                    <div>
                        <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Repository template</label>
                        <select className="w-full max-w-[350px] bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-[#c9d1d9] focus:outline-none focus:border-blue-600 dark:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]">
                            <option>No template</option>
                            <option>financial-research-template</option>
                            <option>code-reviewer-template</option>
                        </select>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex-1">
                            <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Owner <span className="text-[#f85149]">*</span></label>
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 w-max">
                                <img src="https://ui-avatars.com/api/?name=ai-org&background=161b22&color=c9d1d9" alt="org" className="w-5 h-5 rounded-full" />
                                <span className="text-sm font-semibold">ai-org</span>
                            </div>
                        </div>
                        <span className="text-2xl text-gray-500 dark:text-[#8b949e] font-light hidden md:block mt-6">/</span>
                        <div className="flex-2 w-full md:w-auto">
                            <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Repository name <span className="text-[#f85149]">*</span></label>
                            <input 
                                type="text" 
                                value={repoName}
                                onChange={(e) => setRepoName(e.target.value)}
                                className="w-full md:w-[350px] bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 dark:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all text-gray-900 dark:text-[#c9d1d9]" 
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Description <span className="text-xs text-gray-500 dark:text-[#8b949e] font-normal">(optional)</span></label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 dark:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all text-gray-900 dark:text-[#c9d1d9]" 
                        />
                    </div>

                    <hr className="border-gray-200 dark:border-[#30363d]" />

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <input 
                                type="radio" 
                                name="visibility" 
                                id="public" 
                                checked={visibility === 'public'}
                                onChange={() => setVisibility('public')}
                                className="mt-1 accent-[#58a6ff]" 
                            />
                            <div>
                                <label htmlFor="public" className="font-semibold text-gray-900 dark:text-white block">Public</label>
                                <span className="text-xs text-gray-500 dark:text-[#8b949e]">Anyone on the internet can see this agent's memory tree. You choose who can commit.</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="radio" 
                                name="visibility" 
                                id="private" 
                                checked={visibility === 'private'}
                                onChange={() => setVisibility('private')}
                                className="mt-1 accent-[#58a6ff]" 
                            />
                            <div>
                                <label htmlFor="private" className="font-semibold text-gray-900 dark:text-white block">Private</label>
                                <span className="text-xs text-gray-500 dark:text-[#8b949e]">You choose who can see and commit to this agent.</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-[#30363d]" />

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={mutation.isPending || !repoName.trim()}
                            className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-[rgba(240,246,252,0.1)] text-gray-900 dark:text-white px-4 py-1.5 text-sm font-semibold rounded-md transition shadow-sm"
                        >
                            {mutation.isPending ? 'Creating repository...' : 'Create repository'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
