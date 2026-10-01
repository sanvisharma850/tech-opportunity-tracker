import { NextResponse } from 'next/server';
import { getOpportunities, saveOpportunities } from '@/lib/store';
import { TechOpportunity } from '@/types';
import { evaluateDuplicate } from '@/lib/fuzzy';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tier = searchParams.get('tier');
    const confidence = searchParams.get('confidence');
    const status = searchParams.get('status');

    let events = getOpportunities();

    if (status) {
      events = events.filter(e => e.status === status);
    } else {
      events = events.filter(e => e.status === 'published');
    }

    if (type && type !== 'all') {
      events = events.filter(e => e.type === type);
    }

    if (tier && tier !== 'all') {
      events = events.filter(e => e.conference_tier === tier);
    }

    if (confidence && confidence !== 'all') {
      events = events.filter(e => e.discovery_confidence === confidence);
    }

    // Sort by start_date ascending
    events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return NextResponse.json({ success: true, count: events.length, data: events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Allows live authenticated users to submit real tech opportunities
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      conference_tier,
      organizer,
      start_date,
      end_date,
      submission_deadline,
      format,
      location,
      source_url,
      description,
      submitted_by,
      contributors,
    } = body;

    if (!title || !type || !organizer || !start_date || !end_date || !source_url) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory fields: title, type, organizer, start_date, end_date, source_url' },
        { status: 400 }
      );
    }

    // Mandatory URL validation
    try {
      new URL(source_url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid source URL. A real, valid web link is required.' },
        { status: 400 }
      );
    }

    const events = getOpportunities();

    // Check duplicate
    const dupCheck = evaluateDuplicate(
      { title, organizer, start_date, source_url },
      events.map(e => ({ title: e.title, organizer: e.organizer, start_date: e.start_date, source_url: e.source_url }))
    );

    if (dupCheck.isDuplicate) {
      return NextResponse.json(
        { success: false, error: `Duplicate detected. Matches existing opportunity "${dupCheck.matchedTitle}"` },
        { status: 409 }
      );
    }

    const confidence = dupCheck.isAmbiguousNearDuplicate ? 'low' : 'high';
    const confidence_reasons = dupCheck.isAmbiguousNearDuplicate
      ? ['Submitted opportunity is a near-match to an existing event. Flagged for review.']
      : ['Live user submission with verified source URL'];

    const newOpp: TechOpportunity = {
      id: `opp-live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      type,
      conference_tier: conference_tier || null,
      organizer: organizer.trim(),
      start_date,
      end_date,
      submission_deadline: submission_deadline || null,
      format: format || 'online',
      location: location?.trim() || null,
      source_url: source_url.trim(),
      description: description?.trim() || 'Community-submitted live opportunity.',
      discovery_confidence: confidence,
      confidence_reasons,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_by: submitted_by || 'live_user',
      contributors: contributors || [],
    };

    events.push(newOpp);
    saveOpportunities(events);

    return NextResponse.json({ success: true, data: newOpp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, discovery_confidence, conference_tier, submission_deadline, contributors } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing opportunity ID' }, { status: 400 });
    }

    const events = getOpportunities();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    if (status) events[index].status = status;
    if (discovery_confidence) events[index].discovery_confidence = discovery_confidence;
    if (conference_tier !== undefined) events[index].conference_tier = conference_tier;
    if (submission_deadline !== undefined) events[index].submission_deadline = submission_deadline;
    if (contributors !== undefined) events[index].contributors = contributors;
    events[index].updated_at = new Date().toISOString();

    saveOpportunities(events);
    return NextResponse.json({ success: true, data: events[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
