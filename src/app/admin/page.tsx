'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { TechOpportunity, PipelineRunLog } from '@/types';
import { getCurrentUser, isWhitelistedAdmin, login, ADMIN_WHITELIST } from '@/lib/auth';
import { UserProfile } from '@/types/auth';
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Layers,
  Calendar,
  Sparkles,
  Lock,
  ArrowUpRight,
  Database,
  Cpu,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { getAllInteractions } from '@/lib/interactions';

export default function AdminAnalyticsDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [opportunities, setOpportunities] = useState<TechOpportunity[]>([]);
  const [logs, setLogs] = useState<PipelineRunLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [oppsRes, logsRes] = await Promise.all([
          fetch('/api/opportunities?status=published'),
          fetch('/api/pipeline/logs'),
        ]);
        const oppsJson = await oppsRes.json();
        const logsJson = await logsRes.json();

        if (oppsJson.success) setOpportunities(oppsJson.data);
        if (logsJson.success) setLogs(logsJson.data);
      } catch (err) {
        console.error('Failed loading admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAdminAuthOverride = (handle: string) => {
    const res = login(handle);
    if (res.user) setUser(res.user);
  };

  // Interactions statistics
  const userInteractions = useMemo(() => {
    return getAllInteractions();
  }, []);

  const starredTotal = useMemo(() => {
    return Object.values(userInteractions).filter(i => i.starred).length;
  }, [userInteractions]);

  const attendingTotal = useMemo(() => {
    return Object.values(userInteractions).filter(i => i.participating).length;
  }, [userInteractions]);

  const totalComments = useMemo(() => {
    return Object.values(userInteractions).reduce((acc, i) => acc + (i.comments?.length || 0), 0);
  }, [userInteractions]);

  // Visualizations aggregations
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      hackathon: 0,
      conference: 0,
      workshop: 0,
      internship: 0,
    };
    opportunities.forEach(o => {
      if (counts[o.type] !== undefined) counts[o.type]++;
    });
    return counts;
  }, [opportunities]);

  const tierDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    opportunities
      .filter(o => o.type === 'conference' && o.conference_tier)
      .forEach(o => {
        const tier = o.conference_tier || 'Unranked';
        counts[tier] = (counts[tier] || 0) + 1;
      });
    return counts;
  }, [opportunities]);

  const formatDistribution = useMemo(() => {
    const counts: Record<string, number> = { online: 0, 'in-person': 0, hybrid: 0 };
    opportunities.forEach(o => {
      if (counts[o.format] !== undefined) counts[o.format]++;
    });
    return counts;
  }, [opportunities]);

  const pipelineMetrics = useMemo(() => {
    const totalScanned = logs.reduce((acc, l) => acc + (l.events_scanned || 0), 0);
    const totalAdded = logs.reduce((acc, l) => acc + (l.events_added || 0), 0);
    const totalSkipped = logs.reduce((acc, l) => acc + (l.duplicates_skipped || 0), 0);
    const totalArchived = logs.reduce((acc, l) => acc + (l.events_archived || 0), 0);
    return { totalScanned, totalAdded, totalSkipped, totalArchived };
  }, [logs]);

  // Strict whitelist check: Only TanayThapar and Sanvi850
  const isAuthorized = user && (isWhitelistedAdmin(user.handle) || isWhitelistedAdmin(user.email));

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#070b0e] text-zinc-200 font-mono flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b1016] border border-rose-500/50 rounded-xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/50">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              WHITELIST_RESTRICTION // 403 FORBIDDEN
            </h2>
            <div className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-400 text-left space-y-1">
              <div className="text-zinc-500 font-bold uppercase text-[10px]">ACCESS WHITELIST POLICY:</div>
              <p>
                This backend tab is strictly restricted to whitelisted administrators:
              </p>
              <div className="flex flex-wrap gap-2 text-purple-400 font-bold pt-1">
                <span>• @TanayThapar</span>
                <span>• @Sanvi850</span>
                <span>• @panchadip125</span>
              </div>
              {user && (
                <div className="pt-1.5 text-zinc-500 text-[11px] border-t border-zinc-800/80">
                  Current session: <span className="text-zinc-300">@{user.handle}</span> (Standard User)
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAdminAuthOverride('TanayThapar')}
                  className="py-2 bg-purple-950 hover:bg-purple-900 border border-purple-500/60 text-purple-300 font-bold text-xs rounded transition-colors"
                >
                  @TanayThapar
                </button>
                <button
                  onClick={() => handleAdminAuthOverride('Sanvi850')}
                  className="py-2 bg-purple-950 hover:bg-purple-900 border border-purple-500/60 text-purple-300 font-bold text-xs rounded transition-colors"
                >
                  @Sanvi850
                </button>
                <button
                  onClick={() => handleAdminAuthOverride('panchadip125')}
                  className="py-2 bg-purple-950 hover:bg-purple-900 border border-purple-500/60 text-purple-300 font-bold text-xs rounded transition-colors"
                >
                  @panchadip125
                </button>
              </div>

              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-300 py-1"
              >
                &lt;- Return to Public Calendar
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b0e] text-zinc-200 font-mono flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Dashboard Title & Admin Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0b1218] border border-purple-500/40 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/50">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-purple-300 tracking-tight">
                  ADMIN_BACKEND // STATISTICAL TRACKING & TELEMETRY
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/70 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>WHITELISTED: @{user?.handle}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Authorized for <strong className="text-emerald-400">TanayThapar</strong> & <strong className="text-emerald-400">Sanvi850</strong>. Real-time pipeline audit & visual metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-white"
            >
              Calendar Feed
            </Link>
            <Link
              href="/pipeline-logs"
              className="px-3 py-1.5 rounded bg-purple-950/60 border border-purple-500/50 text-xs text-purple-300 hover:bg-purple-900/50"
            >
              Raw Logs
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>LIVE_INDEXED</span>
              <Database className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{opportunities.length}</div>
            <div className="text-[11px] text-emerald-400 font-medium">Published in calendar</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>FUZZY_DEDUPLICATED</span>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{pipelineMetrics.totalSkipped}</div>
            <div className="text-[11px] text-purple-300 font-medium">Spam/duplicates dropped</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>USER_ENGAGEMENT</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{attendingTotal + starredTotal}</div>
            <div className="text-[11px] text-zinc-400">
              {attendingTotal} attending • {starredTotal} starred
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>COMMUNITY_NOTES</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalComments}</div>
            <div className="text-[11px] text-amber-400 font-medium">Discussion entries logged</div>
          </div>
        </div>

        {/* Visual Charts Grid 1: Category Split & Conference Tiering Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Opportunity Category Distribution */}
          <div className="p-5 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <span>// CATEGORY_BREAKDOWN (RELATIVE FREQUENCY)</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">{opportunities.length} TOTAL</span>
            </div>

            <div className="space-y-3">
              {(Object.keys(typeDistribution) as (keyof typeof typeDistribution)[]).map(key => {
                const count = typeDistribution[key];
                const pct = opportunities.length > 0 ? Math.round((count / opportunities.length) * 100) : 0;

                const barColor =
                  key === 'hackathon'
                    ? 'bg-purple-500'
                    : key === 'conference'
                    ? 'bg-cyan-400'
                    : key === 'workshop'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400';

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-zinc-300 font-semibold">{key}s</span>
                      <span className="text-zinc-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${barColor} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Academic Conference Tiering Breakdown */}
          <div className="p-5 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>// CONFERENCE_TIERS (CORE A*, A, B TIER DISTRIBUTION)</span>
              </h3>
            </div>

            <div className="space-y-3">
              {Object.keys(tierDistribution).length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4">// No tiered conferences indexed yet.</p>
              ) : (
                Object.entries(tierDistribution).map(([tier, count]) => {
                  const totalConfs = opportunities.filter(o => o.type === 'conference').length;
                  const pct = totalConfs > 0 ? Math.round((count / totalConfs) * 100) : 0;

                  return (
                    <div key={tier} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                          <span className="text-purple-400">★</span>
                          <span>{tier}</span>
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Visual Charts Grid 2: Event Formats & Discovery Engine Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Format Breakdown */}
          <div className="p-5 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                // FORMAT_DISTRIBUTION (ONLINE VS IN-PERSON VS HYBRID)
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <div className="text-xl font-bold text-emerald-400">{formatDistribution['online'] || 0}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">ONLINE</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <div className="text-xl font-bold text-cyan-400">{formatDistribution['in-person'] || 0}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">IN-PERSON</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <div className="text-xl font-bold text-purple-400">{formatDistribution['hybrid'] || 0}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">HYBRID</div>
              </div>
            </div>
          </div>

          {/* Discovery Engine Health & Cron Performance */}
          <div className="p-5 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                // ENGINE_TELEMETRY: RUN CYCLES
              </h3>
              <span className="text-[11px] text-emerald-400">CRON: ACTIVE (0 2 * * *)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">TOTAL RUNS LOGGED:</span>
                <span className="text-white font-bold">{logs.length} cycles</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">LIFETIME CANDIDATES SCANNED:</span>
                <span className="text-white font-bold">{pipelineMetrics.totalScanned} candidates</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">TOTAL FRESH DISCOVERIES INSERTED:</span>
                <span className="text-emerald-400 font-bold">+{pipelineMetrics.totalAdded} opportunities</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">FUZZY MATCH DEDUPLICATION RATIO:</span>
                <span className="text-purple-400 font-bold">
                  {pipelineMetrics.totalScanned > 0
                    ? `${Math.round((pipelineMetrics.totalSkipped / pipelineMetrics.totalScanned) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Discovered Opportunities Admin Quick Table */}
        <div className="p-5 rounded-xl bg-[#0b1016] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              // RAW_EVENT_REGISTRY & CONFIDENCE AUDIT
            </h3>
            <span className="text-xs text-zinc-500">Showing top {opportunities.slice(0, 8).length} events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-[11px]">
                  <th className="py-2 pr-3">TITLE</th>
                  <th className="py-2 px-3">TYPE</th>
                  <th className="py-2 px-3">ORGANIZER</th>
                  <th className="py-2 px-3">CONFIDENCE</th>
                  <th className="py-2 px-3">FORMAT</th>
                  <th className="py-2 pl-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {opportunities.slice(0, 8).map(o => (
                  <tr key={o.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2.5 pr-3 font-semibold text-zinc-200 truncate max-w-[260px]">
                      {o.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-zinc-400 capitalize">[{o.type}]</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[150px]">{o.organizer}</td>
                    <td className="py-2.5 px-3">
                      {o.discovery_confidence === 'low' ? (
                        <span className="text-amber-400 text-[11px] font-bold">FLAG_REVIEW</span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">VERIFIED</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">[{o.format}]</td>
                    <td className="py-2.5 pl-3 text-right">
                      <a
                        href={o.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>SRC</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
