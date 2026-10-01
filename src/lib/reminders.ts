'use client';

import { TechOpportunity } from '@/types';
import { getAllInteractions } from './interactions';
import { differenceInDays, parseISO } from 'date-fns';

export interface ReminderAlert {
  eventId: string;
  eventTitle: string;
  type: 'conference_start' | 'submission_deadline' | 'hackathon_start' | 'workshop_start';
  daysUntil: number;
  date: string;
  sourceUrl: string;
  urgency: 'critical' | 'warning' | 'info'; // ≤1 day, ≤7 days, ≤14 days
}

const REMINDER_WINDOWS = [1, 3, 7, 14]; // days before event to show reminder

export function getApproachingReminders(opportunities: TechOpportunity[]): ReminderAlert[] {
  if (typeof window === 'undefined') return [];

  const interactions = getAllInteractions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts: ReminderAlert[] = [];

  for (const opp of opportunities) {
    const isParticipating = interactions[opp.id]?.participating;
    const hasReminder = interactions[opp.id]?.reminderEnabled;
    const isContributor = false; // can be extended

    // Only remind for events user is participating in or has reminder enabled
    if (!isParticipating && !hasReminder) continue;

    // Check conference/hackathon/workshop start date
    if (opp.type !== 'internship') {
      try {
        const startDate = parseISO(opp.start_date);
        const daysUntil = differenceInDays(startDate, today);
        if (daysUntil >= 0 && daysUntil <= 14) {
          const typeKey = opp.type === 'conference' ? 'conference_start'
            : opp.type === 'hackathon' ? 'hackathon_start'
            : 'workshop_start';
          alerts.push({
            eventId: opp.id,
            eventTitle: opp.title,
            type: typeKey,
            daysUntil,
            date: opp.start_date,
            sourceUrl: opp.source_url,
            urgency: daysUntil <= 1 ? 'critical' : daysUntil <= 7 ? 'warning' : 'info',
          });
        }
      } catch {}
    }

    // Check submission deadline for conferences
    if (opp.type === 'conference' && opp.submission_deadline) {
      try {
        const deadlineDate = parseISO(opp.submission_deadline);
        const daysUntil = differenceInDays(deadlineDate, today);
        if (daysUntil >= 0 && daysUntil <= 14) {
          alerts.push({
            eventId: opp.id,
            eventTitle: opp.title,
            type: 'submission_deadline',
            daysUntil,
            date: opp.submission_deadline,
            sourceUrl: opp.source_url,
            urgency: daysUntil <= 1 ? 'critical' : daysUntil <= 7 ? 'warning' : 'info',
          });
        }
      } catch {}
    }
  }

  // Sort: critical first, then by daysUntil ascending
  return alerts.sort((a, b) => {
    const urgencyOrder = { critical: 0, warning: 1, info: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.daysUntil - b.daysUntil;
  });
}

export function getReminderLabel(alert: ReminderAlert): string {
  if (alert.daysUntil === 0) return 'TODAY';
  if (alert.daysUntil === 1) return 'TOMORROW';
  return `in ${alert.daysUntil} days`;
}

export function getReminderTypeLabel(type: ReminderAlert['type']): string {
  switch (type) {
    case 'submission_deadline': return '⏳ CFP Deadline';
    case 'conference_start': return '🎓 Conference Starts';
    case 'hackathon_start': return '⚡ Hackathon Starts';
    case 'workshop_start': return '🔧 Workshop Starts';
    default: return 'Event';
  }
}
