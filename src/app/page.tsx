'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import FilterBar from '@/components/FilterBar';
import OpportunityCard from '@/components/OpportunityCard';
import CalendarView from '@/components/CalendarView';
import SubmitOpportunityModal from '@/components/SubmitOpportunityModal';
import { TechOpportunity, OpportunityType, OpportunityFormat } from '@/types';
import {
  Calendar, LayoutList, AlertCircle, Compass,
  Star, UserCheck, PlusCircle, Terminal
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { getAllInteractions } from '@/lib/interactions';

export default function HomePage() {
  const [opportunities, setOpportunities] = useState<TechOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<string | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<OpportunityFormat | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [onlyAttending, setOnlyAttending] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineToast, setPipelineToast] = useState<string | null>(null);
  const [interactionVersion, setInteractionVersion] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opportunities?status=published');
      const json = await res.json();
      if (json.success) {
        setOpportunities(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    const handleInteractionChange = () => setInteractionVersion(v => v + 1);
    window.addEventListener('techradar_interaction_change', handleInteractionChange);
    return () => window.removeEventListener('techradar_interaction_change', handleInteractionChange);
  }, []);

  const handleTriggerPipeline = async () => {
    try {
      setIsRunningPipeline(true);
      setPipelineToast('Running discovery pipeline...');
      const res = await fetch('/api/pipeline/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPipelineToast(data.message || 'Discovery run finished!');
        await fetchOpportunities();
      } else {
        setPipelineToast('Pipeline failed: ' + data.error);
      }
    } catch (err: any) {
      setPipelineToast('Pipeline error: ' + err.message);
    } finally {
      setIsRunningPipeline(false);
      setTimeout(() => setPipelineToast(null), 6000);
    }
  };

  const handleUpdateConfidence = async (id: string, newConfidence: 'high' | 'low') => {
    try {
      const res = await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, discovery_confidence: newConfidence }),
      });
      const data = await res.json();
      if (data.success) {
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, discovery_confidence: newConfidence } : o));
      }
    } catch (err) {
      console.error('Failed updating confidence:', err);
    }
  };

  const tierList = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach(o => { if (o.conference_tier) set.add(o.conference_tier); });
    ['Core A*', 'Core A', 'Core B', 'Core C'].forEach(t => set.add(t));
    return Array.from(set);
  }, [opportunities]);

  const filtered = useMemo(() => {
    const interactions = getAllInteractions();
    return opportunities.filter(item => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedTier !== 'all' && item.conference_tier !== selectedTier) return false;
      if (selectedFormat !== 'all' && item.format !== selectedFormat) return false;
      const userInt = interactions[item.id];
      if (onlyStarred && !userInt?.starred) return false;
      if (onlyAttending && !userInt?.participating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOrg = item.organizer.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTier = item.conference_tier?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrg && !matchesDesc && !matchesTier) return false;
      }
      return true;
    });
  }, [opportunities, selectedType, selectedTier, selectedFormat, searchQuery, onlyStarred, onlyAttending, interactionVersion]);

  const lowConfidenceCount = useMemo(
    () => opportunities.filter(o => o.discovery_confidence === 'low').length,
    [opportunities]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      <Navbar
        onTriggerPipeline={handleTriggerPipeline}
        isRunningPipeline={isRunningPipeline}
        opportunities={opportunities}
      />

      {/* Toast */}
      {pipelineToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-xl shadow-lg flex items-center gap-3 text-xs">
          <Terminal className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p>{pipelineToast}</p>
        </div>
      )}

      <SubmitOpportunityModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitted={fetchOpportunities}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Tech Opportunity Tracker
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {opportunities.length} live events indexed · Conferences, Hackathons, Workshops & Internships
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Add Event */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Event
            </button>

            {/* Starred filter */}
            <button
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                onlyStarred
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
              Starred
            </button>

            {/* Attending filter */}
            <button
              onClick={() => setOnlyAttending(!onlyAttending)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                onlyAttending
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Attending
            </button>

            {lowConfidenceCount > 0 && (
              <Link
                href="/needs-review"
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Review ({lowConfidenceCount})
              </Link>
            )}

            {/* View switcher */}
            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Feed
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tierList={tierList}
        />

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 text-xs gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading opportunities...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 space-y-3 shadow-sm">
            <Compass className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">No opportunities found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Submit a real live opportunity or run the automated discovery crawler to populate the calendar.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add First Event
              </button>
              <button
                onClick={handleTriggerPipeline}
                className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
              >
                Run Discovery Pipeline
              </button>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView opportunities={filtered} onRefresh={fetchOpportunities} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <OpportunityCard
                key={item.id}
                opportunity={item}
                onUpdateConfidence={handleUpdateConfidence}
                showReviewActions={true}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700/60 py-4 text-xs text-gray-500 dark:text-gray-500 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <span className="font-semibold text-gray-700 dark:text-gray-300">TechRadar</span> v2.0 · Conferences, Hackathons, Internships & Workshops
          </p>
          <div className="flex items-center gap-4">
            <Link href="/needs-review" className="hover:text-gray-700 dark:hover:text-gray-300">
              Needs Review ({lowConfidenceCount})
            </Link>
            <Link href="/pipeline-logs" className="hover:text-gray-700 dark:hover:text-gray-300">
              Pipeline Logs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
