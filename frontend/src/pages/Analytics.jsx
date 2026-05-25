import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REFETCH_INTERVAL = 15000; // 15s auto-refresh for real-time feel

// Fetch analytics data from backend
const fetchAnalytics = async () => {
    const res = await fetch(`${API_BASE}/metrics/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const json = await res.json();
    return json.data;
};

// Skeleton loader for cards
function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm animate-pulse">
            <div className="h-3 w-24 bg-gray-200 dark:bg-[#30363d] rounded mb-3"></div>
            <div className="h-7 w-16 bg-gray-200 dark:bg-[#30363d] rounded mb-2"></div>
            <div className="h-2 w-32 bg-gray-200 dark:bg-[#30363d] rounded"></div>
        </div>
    );
}

function SkeletonChart() {
    return (
        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm animate-pulse">
            <div className="border-b border-gray-200 dark:border-[#30363d] px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-t-lg">
                <div className="h-4 w-48 bg-gray-200 dark:bg-[#30363d] rounded"></div>
            </div>
            <div className="p-4"><div className="h-[300px] bg-gray-100 dark:bg-[#0d1117] rounded"></div></div>
        </div>
    );
}

// Live indicator dot
function LiveDot() {
    return (
        <span className="relative flex items-center gap-1.5 text-xs text-green-600 dark:text-[#3fb950]">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-[#3fb950] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 dark:bg-[#3fb950]"></span>
            </span>
            Live
        </span>
    );
}

export default function Analytics() {
    const mainRef = useRef(null);
    const staggerItemsRef = useRef([]);

    const addToStagger = (el) => {
        if (el && !staggerItemsRef.current.includes(el)) {
            staggerItemsRef.current.push(el);
        }
    };

    // ── Fetch analytics with TanStack Query + auto-refetch ──
    const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
        queryKey: ['analytics'],
        queryFn: fetchAnalytics,
        refetchInterval: REFETCH_INTERVAL,
        refetchIntervalInBackground: true,
        staleTime: 10000,
        retry: 2,
    });

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [data]);

    useGSAP(() => {
        if (!isLoading && staggerItemsRef.current.length > 0) {
            gsap.fromTo(staggerItemsRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, ease: "power2.out", delay: 0.05 }
            );
        }
    }, { scope: mainRef, dependencies: [isLoading] });

    // ── Chart theme ──
    const isDark = true;
    const gridColor = isDark ? '#30363d' : '#eaeef2';
    const textColor = isDark ? '#8b949e' : '#57606a';

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: textColor, font: { family: "'Inter', sans-serif", size: 11 } } },
            tooltip: {
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                titleColor: isDark ? '#ffffff' : '#000000',
                bodyColor: isDark ? '#c9d1d9' : '#1F2328',
                borderColor: isDark ? '#30363d' : '#d0d7de',
                borderWidth: 1,
            }
        },
        scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "'Inter', sans-serif" } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "'Inter', sans-serif" } } },
        }
    };

    const noScaleOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { position: 'bottom', labels: { color: textColor, font: { family: "'Inter', sans-serif" } } }
        }
    };

    // ── Derive chart data from API response ──
    const kpis = data?.kpis || {};
    const timeline = data?.activity_timeline || { labels: [], cloud_commits: [], local_commits: [] };
    const tokenTl = data?.token_timeline || { labels: [], tokens_millions: [] };
    const watchdog = data?.watchdog_chart || { labels: [], counts: [] };
    const storage = data?.storage_distribution || { labels: [], values: [] };
    const leaderboard = data?.leaderboard || [];
    const meta = data?.meta || {};

    const hasData = (kpis.total_commits || 0) > 0;

    const activityData = {
        labels: timeline.labels,
        datasets: [
            { label: 'Cloud Agents (Commits)', data: timeline.cloud_commits, borderColor: '#58a6ff', backgroundColor: '#58a6ff', tension: 0.3, borderWidth: 2, pointRadius: 3 },
            { label: 'Local Agents (Commits)', data: timeline.local_commits, borderColor: '#bc8cff', backgroundColor: '#bc8cff', tension: 0.3, borderWidth: 2, pointRadius: 3, borderDash: [5, 5] },
        ]
    };

    const watchdogData = {
        labels: watchdog.labels,
        datasets: [{ label: 'Hallucinations Blocked', data: watchdog.counts, backgroundColor: '#ff7b72', borderRadius: 4 }]
    };

    const tokenData = {
        labels: tokenTl.labels,
        datasets: [{
            label: 'Tokens Used (Millions)', data: tokenTl.tokens_millions,
            borderColor: '#3fb950', backgroundColor: 'rgba(63, 185, 80, 0.15)',
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2,
        }]
    };

    const distributionData = {
        labels: storage.labels,
        datasets: [{ data: storage.values, backgroundColor: ['#bc8cff', '#58a6ff', '#30363d'], borderWidth: 2, borderColor: isDark ? '#0d1117' : '#ffffff' }]
    };

    // Format large numbers
    const fmtNum = (n) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
        return String(n);
    };

    const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '';

    // ── Empty state component ──
    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 dark:text-[#8b949e]">
            <i data-lucide="bar-chart-3" className="w-10 h-10 mb-3 opacity-40"></i>
            <p className="text-sm">{message}</p>
            <p className="text-xs mt-1 opacity-60">Data will appear here as agents create commits</p>
        </div>
    );

    return (
        <div ref={mainRef} className="flex flex-col min-h-screen font-sans bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9]">
            <Navbar />

            <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8">

                {/* Header & Time Filter */}
                <div ref={addToStagger} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-normal text-gray-900 dark:text-white">Cognitive Analytics</h1>
                        <p className="text-sm text-gray-500 dark:text-[#8b949e] mt-1">
                            Monitor agent reasoning paths, local vs. cloud execution, and Watchdog metrics.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <LiveDot />
                        {lastUpdated && (
                            <span className="text-xs text-gray-400 dark:text-[#8b949e]">Updated {lastUpdated}</span>
                        )}
                        <button className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] text-gray-900 dark:text-[#c9d1d9] px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition">
                            <i data-lucide="calendar" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                            {meta.period_start && meta.period_end
                                ? `${meta.period_start} – ${meta.period_end}`
                                : 'Last 7 Days'}
                            <i data-lucide="chevron-down" className="w-4 h-4 text-gray-500 dark:text-[#8b949e]"></i>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {isError && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                        <i data-lucide="alert-triangle" className="w-4 h-4"></i>
                        Failed to load analytics: {error?.message || 'Backend unreachable'}. Retrying...
                    </div>
                )}

                {/* KPI Cards */}
                <div ref={addToStagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {isLoading ? (
                        <>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</>
                    ) : (
                        <>
                            {/* Card 1: Total Commits */}
                            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-[#8b949e]">Total Cognitive Commits</span>
                                    <i data-lucide="git-commit" className="w-4 h-4 text-gray-400 dark:text-[#8b949e]"></i>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-semibold text-gray-900 dark:text-white">{fmtNum(kpis.total_commits || 0)}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-2">
                                    Local: {fmtNum(kpis.local_commits || 0)} | Cloud: {fmtNum(kpis.cloud_commits || 0)}
                                </div>
                            </div>

                            {/* Card 2: Watchdog */}
                            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-[#8b949e]">Watchdog Interventions</span>
                                    <i data-lucide="shield-alert" className="w-4 h-4 text-red-500 dark:text-[#ff7b72]"></i>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-semibold text-gray-900 dark:text-white">{fmtNum(kpis.watchdog_interventions || 0)}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-2">Hallucinations blocked and rolled back</div>
                            </div>

                            {/* Card 3: Branches */}
                            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-[#8b949e]">Active Reasoning Branches</span>
                                    <i data-lucide="git-branch" className="w-4 h-4 text-purple-500 dark:text-[#a371f7]"></i>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-semibold text-gray-900 dark:text-white">{fmtNum(kpis.active_branches || 0)}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-2">Experiments currently running</div>
                            </div>

                            {/* Card 4: Tokens */}
                            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-[#8b949e]">Token Consumption</span>
                                    <i data-lucide="zap" className="w-4 h-4 text-yellow-500 dark:text-[#f2cc60]"></i>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-semibold text-gray-900 dark:text-white">{fmtNum(kpis.total_tokens || 0)}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-[#8b949e] mt-2">Saved via memory pruning/diffing</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Charts Grid */}
                <div ref={addToStagger} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Chart 1: Activity */}
                    {isLoading ? <SkeletonChart /> : (
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm">
                            <div className="border-b border-gray-200 dark:border-[#30363d] px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-t-lg">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Agent Activity: Local vs. Cloud (Commits)</h3>
                            </div>
                            <div className="p-4">
                                <div className="h-[300px] w-full">
                                    {hasData ? <Line data={activityData} options={chartOptions} /> : <EmptyState message="No commit activity yet" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart 2: Watchdog */}
                    {isLoading ? <SkeletonChart /> : (
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm">
                            <div className="border-b border-gray-200 dark:border-[#30363d] px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-t-lg">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Watchdog Interventions by Agent</h3>
                            </div>
                            <div className="p-4">
                                <div className="h-[300px] w-full">
                                    {(watchdog.labels?.length || 0) > 0
                                        ? <Bar data={watchdogData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {display: false}}}} />
                                        : <EmptyState message="No watchdog interventions recorded" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart 3: Token Consumption */}
                    {isLoading ? <SkeletonChart /> : (
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm">
                            <div className="border-b border-gray-200 dark:border-[#30363d] px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-t-lg flex justify-between items-center">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Token Consumption Tracking</h3>
                                <span className="text-xs text-gray-500 dark:text-[#8b949e]">{meta.period_start} – {meta.period_end}</span>
                            </div>
                            <div className="p-4">
                                <div className="h-[300px] w-full">
                                    {hasData ? <Line data={tokenData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {display: false}}}} /> : <EmptyState message="No token usage data yet" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart 4: Storage Distribution */}
                    {isLoading ? <SkeletonChart /> : (
                        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm">
                            <div className="border-b border-gray-200 dark:border-[#30363d] px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-t-lg">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Cognitive Memory Distribution</h3>
                            </div>
                            <div className="p-4 flex items-center justify-center">
                                <div className="h-[300px] w-full max-w-[300px]">
                                    {hasData ? <Doughnut data={distributionData} options={noScaleOptions} /> : <EmptyState message="No storage data yet" />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Leaderboard Table */}
                <div ref={addToStagger} className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-sm overflow-hidden mb-8">
                    <div className="border-b border-gray-200 dark:border-[#30363d] px-4 py-3 bg-gray-50 dark:bg-[#0d1117] flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Agent Efficiency Leaderboard</h3>
                        <span className="text-xs text-gray-500 dark:text-[#8b949e]">{leaderboard.length} agent{leaderboard.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-[#c9d1d9]">
                            <thead className="bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] text-xs text-gray-500 dark:text-[#8b949e] uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Agent Name</th>
                                    <th className="px-4 py-3 font-semibold">Environment</th>
                                    <th className="px-4 py-3 font-semibold text-right">Total Commits</th>
                                    <th className="px-4 py-3 font-semibold text-right">Rollbacks</th>
                                    <th className="px-4 py-3 font-semibold text-right">Health Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#30363d]">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-[#8b949e]">Loading...</td></tr>
                                ) : leaderboard.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-[#8b949e]">
                                        <div className="flex flex-col items-center gap-2">
                                            <i data-lucide="users" className="w-6 h-6 opacity-40"></i>
                                            <span>No agent activity recorded yet</span>
                                        </div>
                                    </td></tr>
                                ) : leaderboard.map((agent) => {
                                    const healthColor = agent.health_score >= 99 ? 'bg-[#3fb950]'
                                        : agent.health_score >= 95 ? 'bg-yellow-400'
                                        : 'bg-[#ff7b72]';

                                    const envStyle = agent.environment?.toLowerCase().includes('local') || agent.environment?.toLowerCase().includes('cli') || agent.environment?.toLowerCase().includes('ide')
                                        ? 'bg-gray-100 dark:bg-[#30363d]/30 text-gray-700 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d]'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';

                                    return (
                                        <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-[#30363d]/20 transition">
                                            <td className="px-4 py-3 font-medium text-blue-600 dark:text-[#58a6ff] flex items-center gap-2">
                                                <i data-lucide="bot" className="w-4 h-4 text-blue-500"></i>
                                                {agent.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs ${envStyle}`}>{agent.environment}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(agent.total_commits)}</td>
                                            <td className="px-4 py-3 text-right text-red-500 dark:text-[#ff7b72] font-mono text-xs">{agent.rollbacks}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2 text-xs">
                                                    {agent.health_score}%
                                                    <div className={`w-16 h-1.5 ${healthColor} rounded-full`}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
