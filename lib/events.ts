import { createClient } from './supabase';
import { Event } from './types';

function getSupabase() {
  return createClient();
}

export async function fetchEvents(filter?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from('events')
    .select('*, event_rsvps(count)')
    .in('status', ['upcoming', 'rescheduled'])
    .order('date', { ascending: true });
  if (filter && filter !== 'all') query = query.eq('type', filter);
  const { data, error } = await query;
  return { data: (data as Event[]) || [], error };
}

export async function fetchMyRsvps(userId: string): Promise<string[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('user_id', userId);
  return (data || []).map((r: any) => r.event_id);
}

export async function rsvpToEvent(
  eventId: string, userId: string, isFull: boolean,
) {
  const supabase = getSupabase();
  const status = isFull ? 'waitlist' : 'confirmed';
  const result = await supabase.from('event_rsvps')
    .insert({ event_id: eventId, user_id: userId, status });
  if (!result.error && !isFull) {
    await supabase.from('event_notifications').insert({
      event_id: eventId, user_id: userId,
      type: 'rsvp_confirmed',
      message: 'Your RSVP is confirmed. We look forward to seeing you.',
    });
  }
  return result;
}

export async function cancelRsvp(eventId: string, userId: string) {
  const supabase = getSupabase();
  return supabase.from('event_rsvps')
    .delete().eq('event_id', eventId).eq('user_id', userId);
}

export async function createEvent(data: Partial<Event>, userId: string) {
  const supabase = getSupabase();
  return supabase.from('events')
    .insert({ ...data, created_by: userId, status: 'upcoming' });
}

export async function cancelEvent(
  eventId: string, event: Event,
) {
  const supabase = getSupabase();
  const { error } = await supabase.from('events')
    .update({ status: 'cancelled' }).eq('id', eventId);
  if (!error && event.notify_members) {
    await supabase.rpc('notify_event_attendees', {
      p_event_id: eventId,
      p_type: 'event_cancelled',
      p_message: `"${event.title}" has been cancelled. We apologise for any inconvenience.`,
    });
  }
  return { error };
}

export async function rescheduleEvent(
  eventId: string, event: Event,
  newDate: string, newTime: string, note: string,
) {
  const supabase = getSupabase();
  const { error } = await supabase.from('events').update({
    date: newDate, time: newTime,
    status: 'rescheduled', reschedule_note: note,
  }).eq('id', eventId);
  if (!error && event.notify_members) {
    await supabase.rpc('notify_event_attendees', {
      p_event_id: eventId,
      p_type: 'event_rescheduled',
      p_message: `"${event.title}" has been rescheduled to ${newDate} at ${newTime}. ${note}`,
    });
  }
  return { error };
}

export async function fetchAttendees(eventId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('event_rsvps')
    .select('*, profiles(full_name, email, hair_type)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function fetchNotifications(userId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('event_notifications')
    .select('*, events(title)')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function markNotificationRead(id: string) {
  const supabase = getSupabase();
  return supabase.from('event_notifications')
    .update({ read: true }).eq('id', id);
}
