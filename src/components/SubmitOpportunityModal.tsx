'use client';

import React, { useState } from 'react';
import { OpportunityType, OpportunityFormat } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { PlusCircle, X, Send, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubmitOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitOpportunityModal({
  isOpen,
  onClose,
  onSubmitted,
}: SubmitOpportunityModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OpportunityType>('hackathon');
  const [conferenceTier, setConferenceTier] = useState('Core A*');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [format, setFormat] = useState<OpportunityFormat>('online');
  const [location, setLocation] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle(''); setType('hackathon'); setConferenceTier('Core A*');
    setOrganizer(''); setStartDate(''); setEndDate('');
    setSubmissionDeadline(''); setFormat('online');
    setLocation(''); setSourceUrl(''); setDescription('');
    setError(null); setSuccess(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const user = getCurrentUser();

    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          conference_tier: type === 'conference' ? conferenceTier : null,
          organizer,
          start_date: startDate,
          end_date: endDate,
          submission_deadline: (type === 'conference' && submissionDeadline) ? submissionDeadline : null,
          format,
          location: format !== 'online' ? location : null,
          source_url: sourceUrl,
          description,
          submitted_by: user?.handle || 'live_user',
          contributors: [],
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Submission failed');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        handleClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-violet-600">
              <div className="flex items-center gap-2 text-white font-bold">
                <PlusCircle className="w-5 h-5" />
                <span className="text-sm">Add Event to Calendar</span>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Send className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Event Published!</p>
                <p className="text-xs text-gray-400">Adding to calendar...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NeurIPS 2027, HackMIT 2026, Google SWE Internship"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Type + Tier/Format row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Category *</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as OpportunityType)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="hackathon">⚡ Hackathon</option>
                      <option value="conference">🎓 Conference</option>
                      <option value="workshop">🔧 Workshop</option>
                      <option value="internship">📌 Internship</option>
                    </select>
                  </div>

                  {type === 'conference' ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Conference Tier</label>
                      <select
                        value={conferenceTier}
                        onChange={e => setConferenceTier(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Core A*">Core A* (Elite)</option>
                        <option value="Core A">Core A</option>
                        <option value="Core B">Core B</option>
                        <option value="Core C">Core C</option>
                        <option value="Tier 1 Industry">Tier 1 Industry</option>
                        <option value="Industry / Non-Academic">Industry / Non-Academic</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Format</label>
                      <select
                        value={format}
                        onChange={e => setFormat(e.target.value as OpportunityFormat)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      >
                        <option value="online">🌐 Online</option>
                        <option value="in-person">📍 In-Person</option>
                        <option value="hybrid">🔀 Hybrid</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Organizer + Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Organizer *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IEEE, MIT, Google, Meta"
                      value={organizer}
                      onChange={e => setOrganizer(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {(format !== 'online' || type === 'conference') && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      {type === 'internship' ? 'Applications Open *' : 'Start Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      {type === 'internship' ? 'Application Deadline *' : 'End Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Submission Deadline (conferences only) */}
                {type === 'conference' && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <label className="block text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5">
                      ⏳ Paper / CFP Submission Deadline
                    </label>
                    <input
                      type="date"
                      value={submissionDeadline}
                      onChange={e => setSubmissionDeadline(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-red-200 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">
                      This will appear as a separate red marker on the calendar
                    </p>
                  </div>
                )}

                {/* Source URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Official Source URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/register or official careers page"
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Short Description (2-3 sentences)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide context, tracks, eligibility criteria, or bounty details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm shadow-blue-500/30"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Publishing...' : 'Add to Calendar'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
