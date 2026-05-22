'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../../lib/supabase';
import {
  fetchEvents, fetchMyRsvps, rsvpToEvent, cancelRsvp,
  createEvent, cancelEvent, rescheduleEvent,
  fetchAttendees,
} from '../../../lib/events';
import { Event, EventType } from '../../../lib/types';

const colors = {
  bg: '#111009',
  card: '#1C1914',
  gold: '#C7AB78',
  goldLight: '#E5D1AD',
  cream: '#F5F2EE',
  muted: '#807A74',
  mutedLight: '#B3ADA6',
  divider: '#332F29',
};

const TYPE_COLORS: Record<string, string> = {
  popup: '#C7AB78',
  workshop: '#9FE1CB',
  editorial: '#CECBF6',
  vip: '#FAC775',
  virtual: '#B5D4F4',
};

const TYPE_LABELS: Record<string, string> = {
  popup: 'Pop-Up',
  workshop: 'Workshop',
  editorial: 'Editorial',
  vip: 'VIP',
  virtual: 'Virtual',
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'popup', label: 'Pop-Up' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'editorial', label: 'Editorial' },
  { key: 'vip', label: 'VIP' },
  { key: 'virtual', label: 'Virtual' },
];

// ═══════════════════════════════════════════════════════════════════════
export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myRsvps, setMyRsvps] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const [eventsResult, rsvps] = await Promise.all([
        fetchEvents(filter),
        fetchMyRsvps(user.id),
      ]);
      setEvents(eventsResult.data);
      setMyRsvps(rsvps);
    } else {
      // Show events even without auth
      const eventsResult = await fetchEvents(filter);
      setEvents(eventsResult.data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── RSVP handler ──────────────────────────────────────────────────
  async function handleRsvp(event: Event) {
    if (!userId) {
      alert('Please sign in to RSVP.');
      return;
    }
    const isRsvpd = myRsvps.includes(event.id);

    if (isRsvpd) {
      if (!confirm(`Cancel your RSVP for "${event.title}"?`)) return;
      const { error } = await cancelRsvp(event.id, userId);
      if (error) { alert(error.message); return; }
      await loadData();
      return;
    }

    const rsvpCount = event.event_rsvps?.[0]?.count ?? 0;
    const isFull = rsvpCount >= event.capacity;

    const { error } = await rsvpToEvent(event.id, userId, isFull);
    if (error) { alert(error.message); return; }
    alert(isFull
      ? `You've been added to the waitlist for "${event.title}".`
      : `Your RSVP for "${event.title}" is confirmed!`);
    await loadData();
  }

  // ── Cancel event ──────────────────────────────────────────────────
  async function handleCancelEvent(event: Event) {
    if (!confirm(`Cancel "${event.title}"? This cannot be undone.`)) return;
    const { error } = await cancelEvent(event.id, event);
    if (error) alert(error.message);
    else await loadData();
  }

  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      maxWidth: 860, margin: '0 auto',
      padding: '40px 24px', minHeight: 'calc(100vh - 64px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 32,
      }}>
        <div>
          <p style={{
            fontSize: 11, color: colors.gold, letterSpacing: 3,
            fontWeight: 600, margin: '0 0 4px',
          }}>YVEY</p>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: colors.cream,
            margin: '0 0 8px', letterSpacing: -0.5,
          }}>Events</h1>
          <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
            {events.length} event{events.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            backgroundColor: showCreateForm ? 'transparent' : colors.gold,
            color: showCreateForm ? colors.gold : colors.bg,
            border: showCreateForm ? `1.5px solid ${colors.gold}` : 'none',
            padding: '12px 20px', borderRadius: 6,
            fontSize: 12, fontWeight: 700, letterSpacing: 2,
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? 'CANCEL' : '+ CREATE EVENT'}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <CreateEventForm
          userId={userId}
          onCreated={() => { setShowCreateForm(false); loadData(); }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap',
      }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setLoading(true); }}
            style={{
              backgroundColor: filter === tab.key ? colors.gold : colors.card,
              color: filter === tab.key ? colors.bg : colors.muted,
              border: `1px solid ${filter === tab.key ? colors.gold : colors.divider}`,
              padding: '10px 18px', borderRadius: 20,
              fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: colors.muted, fontSize: 14 }}>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{
          backgroundColor: colors.card, borderRadius: 12, padding: '60px 40px',
          textAlign: 'center', border: `1px solid ${colors.divider}`,
        }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>✦</p>
          <p style={{ color: colors.muted, fontSize: 15, margin: 0 }}>No events found.</p>
        </div>
      ) : (
        /* Event grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 20,
        }}>
          {events.map(event => (
            <WebEventCard
              key={event.id}
              event={event}
              isRsvpd={myRsvps.includes(event.id)}
              isOwner={userId === event.created_by}
              onRsvp={() => handleRsvp(event)}
              onCancel={() => handleCancelEvent(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// WEB EVENT CARD
// ═══════════════════════════════════════════════════════════════════════
function WebEventCard({
  event, isRsvpd, isOwner, onRsvp, onCancel,
}: {
  event: Event;
  isRsvpd: boolean;
  isOwner: boolean;
  onRsvp: () => void;
  onCancel: () => void;
}) {
  const typeColor = TYPE_COLORS[event.type] || colors.gold;
  const rsvpCount = event.event_rsvps?.[0]?.count ?? 0;
  const isFull = rsvpCount >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  const isRescheduled = event.status === 'rescheduled';
  const capacityPct = Math.min((rsvpCount / event.capacity) * 100, 100);

  return (
    <div style={{
      backgroundColor: colors.card, borderRadius: 14,
      border: `1px solid ${colors.divider}`,
      opacity: isCancelled ? 0.5 : 1,
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      {/* Coloured top bar */}
      <div style={{ height: 4, backgroundColor: typeColor }} />

      <div style={{ padding: 24 }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: typeColor + '20', padding: '4px 10px',
            borderRadius: 12, fontSize: 10, fontWeight: 700,
            color: typeColor, letterSpacing: 1,
          }}>
            {TYPE_LABELS[event.type]?.toUpperCase() || event.type.toUpperCase()}
          </span>
          {event.is_vip_only && (
            <span style={{
              backgroundColor: '#FAC77520', padding: '4px 10px',
              borderRadius: 12, fontSize: 10, fontWeight: 700,
              color: '#FAC775', letterSpacing: 1,
            }}>VIP ONLY</span>
          )}
          {isCancelled && (
            <span style={{
              backgroundColor: '#EF444420', padding: '4px 10px',
              borderRadius: 12, fontSize: 10, fontWeight: 700,
              color: '#EF4444', letterSpacing: 1,
            }}>CANCELLED</span>
          )}
          {isRescheduled && (
            <span style={{
              backgroundColor: '#F59E0B20', padding: '4px 10px',
              borderRadius: 12, fontSize: 10, fontWeight: 700,
              color: '#F59E0B', letterSpacing: 1,
            }}>RESCHEDULED</span>
          )}
        </div>

        {/* Title & description */}
        <h3 style={{
          fontSize: 18, fontWeight: 700, color: colors.cream,
          margin: '0 0 8px',
        }}>{event.title}</h3>
        <p style={{
          fontSize: 13, color: colors.muted, lineHeight: 1.5,
          margin: '0 0 16px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.description}
        </p>

        {/* Reschedule note */}
        {isRescheduled && event.reschedule_note && (
          <div style={{
            backgroundColor: '#F59E0B10', borderRadius: 8, padding: 12,
            marginBottom: 16, borderLeft: '3px solid #F59E0B',
          }}>
            <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, margin: '0 0 4px' }}>Rescheduled</p>
            <p style={{ fontSize: 12, color: colors.mutedLight, margin: 0 }}>{event.reschedule_note}</p>
          </div>
        )}

        {/* Date & location */}
        <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <span style={{ fontSize: 13, color: colors.mutedLight }}>
            {event.date} · {event.time}{event.end_time ? ` – ${event.end_time}` : ''}
          </span>
        </div>
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 13, color: colors.mutedLight }}>{event.location}</span>
        </div>

        {/* Capacity bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: colors.muted, letterSpacing: 1 }}>CAPACITY</span>
            <span style={{ fontSize: 11, color: isFull ? '#EF4444' : colors.mutedLight }}>
              {isFull ? 'FULL' : `${event.capacity - rsvpCount} spot${event.capacity - rsvpCount !== 1 ? 's' : ''} left`}
            </span>
          </div>
          <div style={{
            height: 4, backgroundColor: colors.divider,
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: 4, borderRadius: 2,
              backgroundColor: isFull ? '#EF4444' : typeColor,
              width: `${capacityPct}%`,
              transition: 'width 0.3s',
            }} />
          </div>
          <p style={{ fontSize: 10, color: colors.muted, margin: '4px 0 0' }}>
            {rsvpCount} / {event.capacity} registered
          </p>
        </div>

        {/* RSVP button */}
        {!isCancelled && (
          <button
            onClick={onRsvp}
            style={{
              width: '100%',
              backgroundColor: isRsvpd ? 'transparent' : (isFull ? colors.divider : colors.gold),
              color: isRsvpd ? colors.gold : (isFull ? colors.muted : colors.bg),
              border: isRsvpd ? `1.5px solid ${colors.gold}` : 'none',
              padding: 14, borderRadius: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: 2,
              cursor: 'pointer', transition: 'all 0.2s',
              marginBottom: isOwner ? 12 : 0,
            }}
          >
            {isRsvpd ? '✓  CANCEL RSVP' : (isFull ? 'JOIN WAITLIST' : 'RSVP NOW')}
          </button>
        )}

        {/* Owner: cancel button */}
        {isOwner && !isCancelled && (
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#EF4444',
              border: `1px solid #EF444440`,
              padding: 12, borderRadius: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
              cursor: 'pointer',
            }}
          >
            CANCEL EVENT
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CREATE EVENT FORM
// ═══════════════════════════════════════════════════════════════════════
function CreateEventForm({
  userId, onCreated, onCancel,
}: {
  userId: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('popup');
  const [location, setLocation] = useState('');
  const [virtualLink, setVirtualLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [isVip, setIsVip] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date.trim() || !time.trim()) {
      alert('Title, date, and time are required.');
      return;
    }
    if (!userId) { alert('Please sign in first.'); return; }

    setSaving(true);
    const { error } = await createEvent({
      title: title.trim(),
      description: description.trim(),
      type,
      location: location.trim(),
      virtual_link: virtualLink.trim() || undefined,
      date: date.trim(),
      time: time.trim(),
      end_time: endTime.trim() || undefined,
      capacity: parseInt(capacity) || 50,
      is_vip_only: isVip,
      notify_members: notifyMembers,
    }, userId);

    setSaving(false);
    if (error) { alert(error.message); return; }
    onCreated();
  }

  const types: EventType[] = ['popup', 'workshop', 'editorial', 'vip', 'virtual'];

  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.bg, color: colors.cream,
    padding: 14, borderRadius: 8, fontSize: 14,
    border: `1px solid ${colors.divider}`,
    width: '100%', boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: colors.muted,
    letterSpacing: 2, marginBottom: 8, display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: colors.card, borderRadius: 14,
      border: `1px solid ${colors.divider}`,
      padding: 28, marginBottom: 28,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.cream, margin: '0 0 24px' }}>
        New Event
      </h3>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <div style={{ marginBottom: 18, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>TITLE *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Event title" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the event..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
        </div>

        {/* Type selector */}
        <div style={{ marginBottom: 18, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>TYPE</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button
                key={t} type="button"
                onClick={() => setType(t)}
                style={{
                  backgroundColor: type === t ? TYPE_COLORS[t] + '30' : colors.bg,
                  border: `1px solid ${type === t ? TYPE_COLORS[t] : colors.divider}`,
                  color: type === t ? TYPE_COLORS[t] : colors.muted,
                  padding: '8px 16px', borderRadius: 16,
                  fontSize: 11, fontWeight: 600, letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                {TYPE_LABELS[t]?.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>LOCATION</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Venue · City" style={inputStyle} />
        </div>

        {type === 'virtual' && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>VIRTUAL LINK</label>
            <input value={virtualLink} onChange={e => setVirtualLink(e.target.value)}
              placeholder="https://zoom.us/..." style={inputStyle} />
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>DATE *</label>
          <input value={date} onChange={e => setDate(e.target.value)}
            placeholder="e.g. Sat Jun 7, 2025" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>TIME *</label>
          <input value={time} onChange={e => setTime(e.target.value)}
            placeholder="e.g. 12:00 PM" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>END TIME</label>
          <input value={endTime} onChange={e => setEndTime(e.target.value)}
            placeholder="e.g. 6:00 PM" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>CAPACITY</label>
          <input value={capacity} onChange={e => setCapacity(e.target.value)}
            placeholder="50" type="number" style={inputStyle} />
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: 28, marginBottom: 28 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.cream, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={isVip} onChange={e => setIsVip(e.target.checked)}
            style={{ accentColor: colors.gold, width: 16, height: 16 }} />
          VIP Only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.cream, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={notifyMembers} onChange={e => setNotifyMembers(e.target.checked)}
            style={{ accentColor: colors.gold, width: 16, height: 16 }} />
          Notify members on changes
        </label>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="submit" disabled={saving}
          style={{
            backgroundColor: colors.gold, color: colors.bg,
            border: 'none', padding: '14px 28px', borderRadius: 8,
            fontSize: 12, fontWeight: 700, letterSpacing: 2,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'CREATING...' : 'CREATE EVENT'}
        </button>
        <button
          type="button" onClick={onCancel}
          style={{
            backgroundColor: 'transparent', color: colors.muted,
            border: `1px solid ${colors.divider}`,
            padding: '14px 28px', borderRadius: 8,
            fontSize: 12, fontWeight: 700, letterSpacing: 2,
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
