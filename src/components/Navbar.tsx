'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Terminal,
  Calendar,
  AlertCircle,
  History,
  RefreshCw,
  LogOut,
  Shield,
  BarChart3,
  LogIn,
  Bell,
  X,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { getCurrentUser, logout, isWhitelistedAdmin } from '@/lib/auth';
import { UserProfile } from '@/types/auth';
import { TechOpportunity } from '@/types';
import { getApproachingReminders, getReminderLabel, getReminderTypeLabel, ReminderAlert } from '@/lib/reminders';
import { format, parseISO } from 'date-fns';

interface NavbarProps {
  onTriggerPipeline?: () => void;
  isRunningPipeline?: boolean;
  opportunities?: TechOpportunity[];
}

const EMPTY_OPPORTUNITIES: TechOpportunity[] = [];

export default function Navbar({ onTriggerPipeline, isRunningPipeline, opportunities = EMPTY_OPPORTUNITIES }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showReminderTray, setShowReminderTray] = useState(false);
  const [reminders, setReminders] = useState<ReminderAlert[]>([]);

  const syncUser = () => setUser(getCurrentUser());

  useEffect(() => {
    syncUser();
    window.addEventListener('techradar_auth_change', syncUser);
    return () => window.removeEventListener('techradar_auth_change', syncUser);
  }, []);

  const opportunitiesRef = React.useRef<TechOpportunity[]>(opportunities);

  useEffect(() => {
    opportunitiesRef.current = opportunities;
    setReminders(getApproachingReminders(opportunities));
  }, [opportunities]);

  useEffect(() => {
    const update = () => setReminders(getApproachingReminders(opportunitiesRef.current));
    window.addEventListener('techradar_interaction_change', update);
    return () => window.removeEventListener('techradar_interaction_change', update);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isWhitelisted = user && (isWhitelistedAdmin(user.handle) || isWhitelistedAdmin(user.email));

  const criticalCount = reminders.filter(r => r.urgency === 'critical').length;
  const totalCount = reminders.length;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm hidden sm:block">
                TechRadar
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 text-xs">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                pathname === '/'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </Link>

            <Link
              href="/needs-review"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                pathname === '/needs-review'
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Review</span>
            </Link>

            <Link
              href="/pipeline-logs"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                pathname === '/pipeline-logs'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logs</span>
            </Link>

            {isWhitelisted && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  pathname === '/admin'
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}
          </nav>

          {/* Right side: Pipeline, Reminders, User */}
          <div className="flex items-center gap-2">
            {/* Run Pipeline */}
            {onTriggerPipeline && (
              <button
                onClick={onTriggerPipeline}
                disabled={isRunningPipeline}
                title="Run discovery pipeline"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">{isRunningPipeline ? 'Running...' : 'Refresh'}</span>
              </button>
            )}

            {/* 🔔 Reminder Bell */}
            <div className="relative">
              <button
                onClick={() => setShowReminderTray(!showReminderTray)}
                className={`relative p-2 rounded-lg transition-colors ${
                  totalCount > 0
                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Upcoming reminders"
              >
                <Bell className="w-4 h-4" />
                {totalCount > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white
                    ${criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>
                    {totalCount}
                  </span>
                )}
              </button>

              {/* Reminder Tray Dropdown */}
              {showReminderTray && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Reminders</span>
                    </div>
                    <button onClick={() => setShowReminderTray(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>

                  {reminders.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No upcoming reminders</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Mark events as &quot;Attending&quot; or enable reminders on events you&apos;re tracking.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-[400px] overflow-y-auto">
                      {reminders.map((alert, i) => (
                        <div
                          key={`${alert.eventId}-${alert.type}-${i}`}
                          className={`px-4 py-3 flex items-start gap-3 ${
                            alert.urgency === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                            alert.urgency === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' :
                            'bg-white dark:bg-gray-900'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            alert.urgency === 'critical' ? 'bg-red-500 animate-pulse' :
                            alert.urgency === 'warning' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {getReminderTypeLabel(alert.type)}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{alert.eventTitle}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-bold ${
                                alert.urgency === 'critical' ? 'text-red-600 dark:text-red-400' :
                                alert.urgency === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                                'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {getReminderLabel(alert)} • {format(parseISO(alert.date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex-shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Shows events within 14 days that you&apos;re attending or have reminders enabled.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User pill / Login */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {(user.name?.[0] || user.handle?.[0] || '?').toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                    @{user.handle}
                  </span>
                  {isWhitelisted && (
                    <Shield className="w-3 h-3 text-violet-500" />
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
