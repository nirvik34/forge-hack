import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
    useEffect(() => {
        document.body.classList.add('light-page');
        document.body.classList.remove('dark-page');
        return () => {
            
            
        };
    }, []);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-[#0d1117] font-sans pt-12 sm:pt-24 px-4">
            
            {/* Logo */}
            <div className="mb-6">
                <div className="w-12 h-12 bg-gray-900 dark:bg-[#161b22] rounded-full flex items-center justify-center text-gray-900 dark:text-white">
                    <i data-lucide="git-merge" className="w-8 h-8"></i>
                </div>
            </div>

            <h1 className="text-2xl font-light text-gray-900 dark:text-[#c9d1d9] tracking-tight mb-4">
                Sign in to CognitionVCS
            </h1>

            {/* Form Container */}
            <div className="w-full max-w-[340px]">
                <div className="bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-4 shadow-[0_1px_3px_rgba(27,31,36,0.04)] mb-4 bg-white">
                    <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard'; }}>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-900 dark:text-[#c9d1d9] mb-1">
                                Username or email address
                            </label>
                            <input 
                                type="text" 
                                className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#58a6ff] transition-colors"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-900 dark:text-[#c9d1d9]">
                                    Password
                                </label>
                                <a href="#!" className="text-xs text-blue-600 dark:text-[#58a6ff] hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <input 
                                type="password" 
                                className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 dark:focus:border-[#58a6ff] focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#58a6ff] transition-colors"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-green-700 dark:hover:bg-[#2ea043] border border-[rgba(27,31,36,0.15)] text-white font-medium text-sm py-1.5 rounded-md shadow-[0_1px_0_rgba(27,31,36,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors"
                        >
                            Sign in
                        </button>
                    </form>
                </div>

                {/* Bottom Box */}
                <div className="border border-gray-300 dark:border-[#30363d] rounded-md p-4 text-center text-sm text-gray-900 dark:text-[#c9d1d9] bg-white">
                    New to CognitionVCS? <Link to="/signup" className="text-blue-600 dark:text-[#58a6ff] hover:underline">Create an account</Link>.
                </div>

                {/* Footer Links */}
                <div className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-[#656d76]">
                    <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Terms</a>
                    <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Privacy</a>
                    <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Security</a>
                    <a href="#!" className="hover:text-blue-600 dark:text-[#58a6ff] hover:underline">Contact CognitionVCS</a>
                </div>
            </div>
        </div>
    );
}
