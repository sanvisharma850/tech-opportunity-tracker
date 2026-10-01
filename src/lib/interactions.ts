'use client';

import { UserEventInteraction, EventComment } from '@/types';

const STORAGE_KEY = 'techradar_user_interactions_v1';

export function getAllInteractions(): Record<string, UserEventInteraction> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getInteraction(eventId: string): UserEventInteraction {
  const all = getAllInteractions();
  return all[eventId] || { starred: false, participating: false, comments: [], reminderEnabled: false };
}

export function saveInteraction(eventId: string, data: Partial<UserEventInteraction>): UserEventInteraction {
  const all = getAllInteractions();
  const current = all[eventId] || { starred: false, participating: false, comments: [], reminderEnabled: false };
  const updated: UserEventInteraction = {
    ...current,
    ...data,
  };
  all[eventId] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('techradar_interaction_change'));
  }
  return updated;
}

export function toggleStar(eventId: string): boolean {
  const curr = getInteraction(eventId);
  const nextVal = !curr.starred;
  saveInteraction(eventId, { starred: nextVal });
  return nextVal;
}

export function toggleParticipating(eventId: string): boolean {
  const curr = getInteraction(eventId);
  const nextVal = !curr.participating;
  saveInteraction(eventId, { participating: nextVal });
  return nextVal;
}

export function toggleReminder(eventId: string): boolean {
  const curr = getInteraction(eventId);
  const nextVal = !curr.reminderEnabled;
  saveInteraction(eventId, { reminderEnabled: nextVal });
  return nextVal;
}

export function addComment(eventId: string, author: string, text: string): EventComment {
  const curr = getInteraction(eventId);
  const newComment: EventComment = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    author: author.trim() || 'Anonymous Hacker',
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };
  const comments = [...(curr.comments || []), newComment];
  saveInteraction(eventId, { comments });
  return newComment;
}
