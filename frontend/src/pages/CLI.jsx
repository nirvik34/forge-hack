import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';

export default function CLI() {
  const [command, setCommand] = useState('');
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: async (cmd) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/cli/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmd, args: [] }),
      });
      if (!res.ok) throw new Error('Failed to execute command');
      return res.json();
    },
    onSuccess: () => {
      // Refresh history after a successful command
      queryClient.invalidateQueries({ queryKey: ['cliHistory'] });
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['cliHistory'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/cli/history`);
      if (!res.ok) throw new Error('Failed to fetch CLI history');
      return res.json();
    },
    staleTime: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    executeMutation.mutate(command.trim());
    setCommand('');
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Command Input */}
        <section className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">CLI Command</h2>
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Enter command (e.g., cvc commit)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md text-sm focus:outline-none focus:border-blue-600 dark:focus:border-[#58a6ff]"
            />
            <button
              type="submit"
              disabled={executeMutation.isPending}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
            >
              Run
            </button>
          </form>
          {executeMutation.isError && (
            <p className="mt-2 text-sm text-red-600 dark:text-[#ff7b72]">
              {executeMutation.error?.message}
            </p>
          )}
        </section>

        {/* History */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Command History</h2>
          {historyLoading ? (
            <p className="text-sm text-gray-500 dark:text-[#8b949e]">Loading history...</p>
          ) : (
            <ul className="space-y-3">
              {history?.map((item) => (
                <li key={item.id} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-md p-3 shadow-sm">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono text-gray-800 dark:text-[#c9d1d9]">{item.command}</span>
                    <span className="text-xs text-gray-500 dark:text-[#8b949e]">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  {item.args && item.args.length > 0 && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-[#8b949e]">Args: {item.args.join(' ')}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-700 dark:text-[#c9d1d9] whitespace-pre-wrap">{item.output}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
