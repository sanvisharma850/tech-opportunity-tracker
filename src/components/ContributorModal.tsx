'use client';

import React, { useState, useEffect } from 'react';
import { TechOpportunity, Contributor } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { X, Users, UserPlus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const USERS_DB_KEY = 'techradar_registered_users_v1';

interface ContributorModalProps {
  event: TechOpportunity;
  onClose: () => void;
  onSaved: () => void;
}

interface RegisteredUser {
  id: string;
  name: string;
  handle: string;
  email: string;
}

export default function ContributorModal({ event, onClose, onSaved }: ContributorModalProps) {
  const currentUser = getCurrentUser();
  const [contributors, setContributors] = useState<Contributor[]>(event.contributors || []);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('attendee');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USERS_DB_KEY);
      if (raw) setRegisteredUsers(JSON.parse(raw));
    } catch {}
  }, []);

  const filteredUsers = registeredUsers.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.handle.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }).filter(u => !contributors.some(c => c.id === u.id));

  const addContributor = (user: RegisteredUser) => {
    const newContributor: Contributor = {
      id: user.id,
      name: user.name,
      handle: user.handle,
      email: user.email,
      role: selectedRole,
      addedAt: new Date().toISOString(),
    };
    setContributors(prev => [...prev, newContributor]);
    setSearch('');
  };

  const removeContributor = (id: string) => {
    setContributors(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, contributors }),
      });
      const json = await res.json();
      if (json.success) {
        onSaved();
      } else {
        setError(json.error || 'Failed to save contributors');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = ['attendee', 'author', 'presenter', 'co-author', 'organizer', 'reviewer', 'volunteer'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Manage Contributors</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Event name */}
          <p className="text-xs text-gray-500 dark:text-gray-400 border-l-2 border-blue-400 pl-2">
            {event.title}
          </p>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Current contributors */}
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Current Team ({contributors.length})
            </p>
            {contributors.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No contributors added yet. Add registered users below.</p>
            ) : (
              <div className="space-y-1.5">
                {contributors.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(c.name?.[0] || c.handle?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.name} <span className="text-gray-400">@{c.handle}</span></p>
                        <p className="text-[10px] text-blue-500 capitalize">{c.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeContributor(c.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add contributor */}
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Add Registered Users
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Search by name, @handle or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              />
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="px-2 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
              >
                {roleOptions.map(r => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>

            {registeredUsers.length === 0 && (
              <p className="text-xs text-gray-400 italic">No registered users found. Users appear here after they sign in.</p>
            )}

            {search.trim() && filteredUsers.length === 0 && registeredUsers.length > 0 && (
              <p className="text-xs text-gray-400 italic">No matching users found, or all matching users already added.</p>
            )}

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {filteredUsers.slice(0, 8).map(u => (
                <button
                  key={u.id}
                  onClick={() => addContributor(u)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(u.name?.[0] || u.handle?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{u.name}</p>
                      <p className="text-[10px] text-gray-400">@{u.handle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-500 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    Add
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Team'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
