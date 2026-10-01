'use client';

import React, { useState, useMemo } from 'react';
import { TechOpportunity } from '@/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  UserCheck,
  Bell,
  BellOff,
  Users,
  Clock,
  MapPin,
  CalendarDays,
  X,
  Bookmark,
  AlertTriangle,
} from 'lucide-react';
import { TypeBadge, TierBadge, CATEGORY_COLORS } from './Badge';
import { getInteraction, toggleStar, toggleParticipating, toggleReminder } from '@/lib/interactions';
import { getCurrentUser } from '@/lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import ContributorModal from './ContributorModal';

interface CalendarViewProps {
  opportunities: TechOpportunity[];
  onRefresh?: () => void;
}

// Event pill height classes
const TYPE_PILL: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  hackathon: { bg: 'bg-purple-600/90', text: 'text-white', border: 'border-purple-400/40', dot: 'bg-purple-400' },
  conference: { bg: 'bg-blue-600/90', text: 'text-white', border: 'border-blue-400/40', dot: 'bg-blue-400' },
  workshop:   { bg: 'bg-emerald-600/90', text: 'text-white', border: 'border-emerald-400/40', dot: 'bg-emerald-400' },
  internship: { bg: 'bg-amber-500/90', text: 'text-black font-bold', border: 'border-amber-400/40', dot: 'bg-amber-400' },
  deadline:   { bg: 'bg-red-600/90', text: 'text-white', border: 'border-red-400/40', dot: 'bg-red-400' },
};

function getDaysUntil(dateStr: string): number {
  try {
    const d = parseISO(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return differenceInDays(d, today);
  } catch { return 999; }
}

function UrgencyBadge({ daysUntil, label }: { daysUntil: number; label: string }) {
  if (daysUntil < 0) return null;
  const color = daysUntil <= 1 ? 'bg-red-500 text-white animate-pulse' : daysUntil <= 7 ? 'bg-orange-500 text-white' : 'bg-yellow-600/80 text-white';
  const text = daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil}d`;
  return (
    <span className={`text-[9px] font-black px-1 py-0.5 rounded ${color}`}>
      {label} {text}
    </span>
  );
}

export default function CalendarView({ opportunities, onRefresh }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(today);
  const [selectedEvent, setSelectedEvent] = useState<TechOpportunity | null>(null);
  const [interactionVer, setInteractionVer] = useState(0);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const refreshInteractions = () => setInteractionVer(v => v + 1);

  /**
   * Returns events for a given day:
   * - conferences/hackathons/workshops: span start_date → end_date
   * - internships: only show on start_date (single box)
   * - conferences with submission_deadline: also show a "CFP DEADLINE" marker on that day
   */
  const getDayEvents = (day: Date): { event: TechOpportunity; isDeadline?: boolean; isStart?: boolean }[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const results: { event: TechOpportunity; isDeadline?: boolean; isStart?: boolean }[] = [];

    for (const event of opportunities) {
      try {
        const startStr = event.start_date.split('T')[0];
        const endStr = event.end_date.split('T')[0];

        if (event.type === 'internship') {
          // Internships: only on their start_date
          if (dayStr === startStr) {
            results.push({ event, isStart: true });
          }
        } else {
          // Non-internships: show across span
          if (dayStr >= startStr && dayStr <= endStr) {
            results.push({ event, isStart: dayStr === startStr });
          }
        }

        // Submission deadline marker for conferences
        if (event.type === 'conference' && event.submission_deadline) {
          const dlStr = event.submission_deadline.split('T')[0];
          if (dayStr === dlStr) {
            results.push({ event, isDeadline: true });
          }
        }
      } catch {}
    }
    return results;
  };

  const currentMonthEvents = useMemo(() => {
    const mStart = format(monthStart, 'yyyy-MM-dd');
    const mEnd = format(monthEnd, 'yyyy-MM-dd');
    return opportunities.filter(event => {
      const s = event.start_date.split('T')[0];
      const e = event.end_date.split('T')[0];
      return s <= mEnd && e >= mStart;
    });
  }, [opportunities, monthStart, monthEnd]);

  const handleEventClick = (event: TechOpportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const currentUser = getCurrentUser();

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
      {/* ── Google Calendar-style Toolbar ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          {(['hackathon', 'conference', 'workshop', 'internship'] as const).map(t => (
            <span key={t} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 capitalize">
              <span className={`w-2 h-2 rounded-sm ${TYPE_PILL[t].bg}`} />
              {t}s
            </span>
          ))}
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <span className="w-2 h-2 rounded-sm bg-red-600" />
            CFP Deadline
          </span>
        </div>
      </div>

      {/* ── Weekday Header ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 flex-1 bg-white dark:bg-gray-900">
        {days.map((day, idx) => {
          const dayEntries = getDayEvents(day);
          const inMonth = isSameMonth(day, currentMonth);
          const todayFlag = isToday(day);
          const isSelected = selectedDayDate ? isSameDay(day, selectedDayDate) : false;

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDayDate(isSameDay(day, selectedDayDate || new Date(0)) ? null : day)}
              className={`
                min-h-[110px] sm:min-h-[130px] p-1 border-b border-r border-gray-100 dark:border-gray-800 cursor-pointer transition-colors relative
                ${!inMonth ? 'bg-gray-50/60 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-900 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
                ${idx % 7 === 0 ? 'border-l' : ''}
              `}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                    ${todayFlag ? 'bg-blue-600 text-white' : inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'}
                  `}
                >
                  {format(day, 'd')}
                </span>
                {dayEntries.length > 0 && (
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 pr-0.5">
                    {dayEntries.length}
                  </span>
                )}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5 overflow-hidden">
                {dayEntries.slice(0, 3).map((entry, ei) => {
                  const { event, isDeadline, isStart } = entry;
                  const cfg = isDeadline ? TYPE_PILL.deadline : TYPE_PILL[event.type] || TYPE_PILL.hackathon;
                  const label = isDeadline
                    ? `⏳ CFP: ${event.title}`
                    : event.type === 'internship'
                    ? `📌 ${event.title}`
                    : event.title;
                  const interaction = getInteraction(event.id);

                  return (
                    <button
                      key={`${event.id}-${isDeadline ? 'dl' : 'ev'}-${ei}`}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className={`
                        w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1
                        ${cfg.bg} ${cfg.text} hover:opacity-90 transition-opacity
                        ${isStart && !isDeadline ? 'rounded-l-full' : ''}
                      `}
                      title={label}
                    >
                      {interaction.participating && !isDeadline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
                      )}
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
                {dayEntries.length > 3 && (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedDayDate(day); }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-medium pl-1 hover:underline"
                  >
                    +{dayEntries.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── This Month Summary ──────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {format(currentMonth, 'MMMM yyyy')} — {currentMonthEvents.length} events
        </h3>
        {currentMonthEvents.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No events this month. Navigate with arrows or add one.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {currentMonthEvents.map(evt => {
              const cfg = CATEGORY_COLORS[evt.type] || CATEGORY_COLORS.hackathon;
              const daysToStart = getDaysUntil(evt.start_date);
              const daysToDeadline = evt.submission_deadline ? getDaysUntil(evt.submission_deadline) : null;
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`text-left p-2.5 rounded-xl border ${cfg.border} bg-white dark:bg-gray-900 hover:shadow-md transition-all group`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <TypeBadge type={evt.type} />
                    {evt.type === 'conference' && <TierBadge tier={evt.conference_tier} />}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {evt.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {evt.type === 'internship' ? '📌 Opens: ' : ''}{format(parseISO(evt.start_date), 'MMM d')}
                    {evt.type !== 'internship' && ` → ${format(parseISO(evt.end_date), 'MMM d')}`}
                  </p>
                  {daysToStart >= 0 && daysToStart <= 14 && evt.type !== 'internship' && (
                    <UrgencyBadge daysUntil={daysToStart} label="Starts" />
                  )}
                  {daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 14 && (
                    <UrgencyBadge daysUntil={daysToDeadline} label="CFP Due" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Event Detail Popover / Side Panel ──────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 60, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto"
            >
              <EventDetailPanel
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onRefresh={refreshInteractions}
                onOpenContributors={() => setShowContributorModal(true)}
                currentUser={currentUser}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Contributor Modal ───────────────────────────────────────────────── */}
      {showContributorModal && selectedEvent && (
        <ContributorModal
          event={selectedEvent}
          onClose={() => setShowContributorModal(false)}
          onSaved={() => { setShowContributorModal(false); onRefresh?.(); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Event Detail Panel
// ──────────────────────────────────────────────────────────────────────────────
function EventDetailPanel({
  event,
  onClose,
  onRefresh,
  onOpenContributors,
  currentUser,
}: {
  event: TechOpportunity;
  onClose: () => void;
  onRefresh: () => void;
  onOpenContributors: () => void;
  currentUser: ReturnType<typeof getCurrentUser>;
}) {
  const [interaction, setInteraction] = React.useState(() => getInteraction(event.id));
  const cfg = TYPE_PILL[event.type] || TYPE_PILL.hackathon;
  const daysToStart = getDaysUntil(event.start_date);
  const daysToDeadline = event.submission_deadline ? getDaysUntil(event.submission_deadline) : null;

  const handleStar = () => {
    toggleStar(event.id);
    setInteraction(getInteraction(event.id));
    onRefresh();
  };
  const handleParticipate = () => {
    toggleParticipating(event.id);
    setInteraction(getInteraction(event.id));
    onRefresh();
  };
  const handleReminder = () => {
    toggleReminder(event.id);
    setInteraction(getInteraction(event.id));
    onRefresh();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header strip */}
      <div className={`${cfg.bg} px-5 py-4 flex items-start justify-between`}>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TypeBadge type={event.type} />
            {event.type === 'conference' && <TierBadge tier={event.conference_tier} />}
          </div>
          <h2 className="text-base font-bold text-white leading-tight">{event.title}</h2>
          <p className="text-xs text-white/80 mt-0.5">{event.organizer}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors ml-3 mt-0.5 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-5 space-y-4 overflow-y-auto">
        {/* Urgency alerts */}
        {daysToStart !== null && daysToStart >= 0 && daysToStart <= 14 && event.type !== 'internship' && (
          <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold
            ${daysToStart <= 1 ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' :
              daysToStart <= 7 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700' :
              'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'}`}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Event starts {daysToStart === 0 ? 'TODAY!' : daysToStart === 1 ? 'TOMORROW!' : `in ${daysToStart} days`}
          </div>
        )}
        {daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 14 && (
          <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold
            ${daysToDeadline <= 1 ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' :
              daysToDeadline <= 7 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700' :
              'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'}`}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            ⏳ CFP/Paper submission {daysToDeadline === 0 ? 'DUE TODAY!' : daysToDeadline === 1 ? 'DUE TOMORROW!' : `due in ${daysToDeadline} days`}
          </div>
        )}

        {/* Date details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300">
            <CalendarDays className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              {event.type === 'internship' ? (
                <div>
                  <p className="font-medium">Applications Open: {format(parseISO(event.start_date), 'EEE, MMM d, yyyy')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deadline: {format(parseISO(event.end_date), 'EEE, MMM d, yyyy')}</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    {format(parseISO(event.start_date), 'EEE, MMM d')} – {format(parseISO(event.end_date), 'EEE, MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {differenceInDays(parseISO(event.end_date), parseISO(event.start_date)) + 1} day(s)
                  </p>
                </div>
              )}
            </div>
          </div>

          {event.submission_deadline && (
            <div className="flex items-start gap-2.5 text-red-600 dark:text-red-400">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide">Paper/CFP Submission Deadline</p>
                <p className="font-medium">{format(parseISO(event.submission_deadline), 'EEE, MMM d, yyyy')}</p>
                {daysToDeadline !== null && daysToDeadline >= 0 && (
                  <p className="text-xs font-bold">{daysToDeadline === 0 ? 'DUE TODAY' : `${daysToDeadline} days remaining`}</p>
                )}
                {daysToDeadline !== null && daysToDeadline < 0 && (
                  <p className="text-xs text-gray-400">Submission period has passed</p>
                )}
              </div>
            </div>
          )}

          {event.location && (
            <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p>{event.location}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <span className={`w-2.5 h-2.5 rounded-sm ${cfg.bg}`} />
            </span>
            <span className="capitalize">{event.format}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">About</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{event.description}</p>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            onClick={handleStar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              ${interaction.starred
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300'
              }`}
          >
            <Star className={`w-3.5 h-3.5 ${interaction.starred ? 'fill-amber-500 text-amber-500' : ''}`} />
            {interaction.starred ? 'Starred' : 'Star'}
          </button>

          <button
            onClick={handleParticipate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              ${interaction.participating
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${interaction.participating ? 'text-blue-600' : ''}`} />
            {interaction.participating ? '✓ Participating' : 'Mark Attending'}
          </button>

          <button
            onClick={handleReminder}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              ${interaction.reminderEnabled
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-300'
              }`}
          >
            {interaction.reminderEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {interaction.reminderEnabled ? 'Reminder On' : 'Set Reminder'}
          </button>

          <button
            onClick={onOpenContributors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            Contributors {event.contributors && event.contributors.length > 0 ? `(${event.contributors.length})` : ''}
          </button>
        </div>

        {/* Contributors list */}
        {event.contributors && event.contributors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Team / Contributors</p>
            <div className="flex flex-wrap gap-2">
              {event.contributors.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {(c.name?.[0] || c.handle?.[0] || '?').toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">@{c.handle}</span>
                  {c.role && <span className="text-[10px] text-gray-400">{c.role}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source link */}
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          <Bookmark className="w-4 h-4" />
          Open Official Page
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
