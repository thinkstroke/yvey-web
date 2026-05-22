'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../../lib/supabase';
import {
  fetchEvents, fetchMyRsvps, rsvpToEvent, cancelRsvp,
  createEvent, cancelEvent,
  TYPE_COLORS, EVENT_TYPES, TYPE_IMAGES, getEventImage, isValidImageUrl,
} from '../../../lib/events';
import { Event, EventType } from '../../../lib/types';

const c = {
  bg:       '#0E0C09',
  card:     '#181410',
  card2:    '#1E1A14',
  gold:     '#C7AB78',
  goldLight:'#E5D1AD',
  goldDim:  'rgba(199,171,120,0.12)',
  cream:    '#F5F2EE',
  muted:    '#807A74',
  mutedLight:'#B3ADA6',
  divider:  '#2A251E',
};

const TYPE_LABELS: Record<string, string> = {
  popup: 'Pop-Up', workshop: 'Workshop', editorial: 'Editorial',
  vip: 'VIP', virtual: 'Virtual',
};

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: '' },
  ...EVENT_TYPES.map(t => ({ key: t.key, label: t.label, icon: t.icon })),
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myRsvps, setMyRsvps] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const [eventsResult, rsvps] = await Promise.all([
          fetchEvents(filter), fetchMyRsvps(user.id),
        ]);
        setEvents(eventsResult.data);
        setMyRsvps(rsvps);
      } else {
        const eventsResult = await fetchEvents(filter);
        setEvents(eventsResult.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleRsvp(event: Event) {
    if (!userId) { alert('Please sign in to RSVP.'); return; }
    const isRsvpd = myRsvps.includes(event.id);
    if (isRsvpd) {
      if (!confirm(`Cancel your RSVP for "${event.title}"?`)) return;
      const { error } = await cancelRsvp(event.id, userId);
      if (error) { alert(error.message); return; }
      await loadData(); return;
    }
    const rsvpCount = event.event_rsvps?.[0]?.count ?? 0;
    const isFull = rsvpCount >= event.capacity;
    const { error } = await rsvpToEvent(event.id, userId, isFull);
    if (error) { alert(error.message); return; }
    alert(isFull ? `Waitlisted for "${event.title}".` : `RSVP confirmed for "${event.title}"!`);
    await loadData();
  }

  async function handleCancelEvent(event: Event) {
    if (!confirm(`Cancel "${event.title}"? This cannot be undone.`)) return;
    const { error } = await cancelEvent(event.id, event);
    if (error) alert(error.message);
    else await loadData();
  }

  const totalCapacity = events.reduce((s, e) => s + e.capacity, 0);
  const totalRsvps = events.reduce((s, e) => s + (e.event_rsvps?.[0]?.count ?? 0), 0);
  const spotsRemaining = totalCapacity - totalRsvps;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 32px', fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, color: c.gold, letterSpacing: 3, fontWeight: 600, margin: '0 0 4px' }}>YVEY</p>
          <h1 style={{
            fontSize: 42, fontWeight: 300, color: c.cream, margin: '0 0 8px',
            fontFamily: "'Cormorant Garamond', serif", letterSpacing: -0.5,
          }}>Events</h1>
          <p style={{ fontSize: 13, color: c.muted, margin: 0 }}>
            {events.length} upcoming event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={{
          backgroundColor: showCreateForm ? 'transparent' : c.gold,
          color: showCreateForm ? c.gold : c.bg,
          border: showCreateForm ? `1.5px solid ${c.gold}` : 'none',
          padding: '12px 22px', borderRadius: 6, fontSize: 12, fontWeight: 700,
          letterSpacing: 2, cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
        }}>
          {showCreateForm ? 'CANCEL' : '+ CREATE EVENT'}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        backgroundColor: c.card, borderRadius: 12, border: `1px solid ${c.divider}`,
        overflow: 'hidden',
      }}>
        {[
          { label: 'Total Events', value: events.length },
          { label: 'Total Capacity', value: totalCapacity },
          { label: 'Spots Remaining', value: spotsRemaining },
          { label: 'Your RSVPs', value: myRsvps.length },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            flex: 1, padding: '18px 20px', textAlign: 'center',
            borderRight: i < 3 ? `1px solid ${c.divider}` : 'none',
          }}>
            <p style={{ fontSize: 24, fontWeight: 300, color: c.cream, margin: '0 0 4px',
              fontFamily: "'Cormorant Garamond', serif" }}>{stat.value}</p>
            <p style={{ fontSize: 10, color: c.muted, letterSpacing: 1.5, margin: 0 }}>{stat.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <CreateEventForm userId={userId}
          onCreated={() => { setShowCreateForm(false); loadData(); }}
          onCancel={() => setShowCreateForm(false)} />
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => { setFilter(tab.key); setLoading(true); }}
            style={{
              backgroundColor: filter === tab.key ? c.gold : c.card,
              color: filter === tab.key ? c.bg : c.muted,
              border: `1px solid ${filter === tab.key ? c.gold : c.divider}`,
              padding: '10px 18px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              letterSpacing: 1.5, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Barlow', sans-serif",
            }}>
            {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: c.muted, fontSize: 14 }}>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{
          backgroundColor: c.card, borderRadius: 16, padding: '64px 40px',
          textAlign: 'center', border: `1px solid ${c.divider}`,
        }}>
          <p style={{ fontSize: 36, margin: '0 0 14px' }}>✦</p>
          <p style={{ color: c.muted, fontSize: 15, margin: 0 }}>No events found.</p>
        </div>
      ) : (
        <div>
          {/* Featured card — first event */}
          {events.length > 0 && (
            <FeaturedCard event={events[0]}
              isRsvpd={myRsvps.includes(events[0].id)}
              isOwner={userId === events[0].created_by}
              onRsvp={() => handleRsvp(events[0])}
              onCancel={() => handleCancelEvent(events[0])} />
          )}

          {/* Grid for remaining */}
          {events.length > 1 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 20,
            }}>
              {events.slice(1).map(event => (
                <WebEventCard key={event.id} event={event}
                  isRsvpd={myRsvps.includes(event.id)}
                  isOwner={userId === event.created_by}
                  onRsvp={() => handleRsvp(event)}
                  onCancel={() => handleCancelEvent(event)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FEATURED CARD (first event, full width)
// ═══════════════════════════════════════════════════════════════════════
function FeaturedCard({ event, isRsvpd, isOwner, onRsvp, onCancel }: {
  event: Event; isRsvpd: boolean; isOwner: boolean;
  onRsvp: () => void; onCancel: () => void;
}) {
  const typeColor = TYPE_COLORS[event.type] || c.gold;
  const rsvpCount = event.event_rsvps?.[0]?.count ?? 0;
  const isFull = rsvpCount >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  const capacityPct = Math.min((rsvpCount / event.capacity) * 100, 100);

  return (
    <div style={{
      display: 'flex', backgroundColor: c.card, borderRadius: 16,
      border: `1px solid ${c.divider}`, overflow: 'hidden',
      marginBottom: 24, opacity: isCancelled ? 0.5 : 1,
    }}>
      {/* Image left */}
      <div style={{ width: '45%', minHeight: 300, position: 'relative', flexShrink: 0 }}>
        <img src={getEventImage(event)} alt={event.title} loading="lazy"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'brightness(0.85) saturate(0.9)',
          }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 60%, rgba(24,20,16,1))',
        }} />
        <span style={{
          position: 'absolute', top: 16, left: 16,
          backgroundColor: typeColor, padding: '5px 12px', borderRadius: 14,
          fontSize: 10, fontWeight: 700, color: c.bg, letterSpacing: 1,
        }}>{TYPE_LABELS[event.type]?.toUpperCase()}</span>
        {event.is_vip_only && (
          <span style={{
            position: 'absolute', top: 16, right: 16,
            backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: 14,
            fontSize: 10, fontWeight: 700, color: '#FAC775', letterSpacing: 1,
            border: '1px solid #FAC775',
          }}>VIP ONLY</span>
        )}
      </div>

      {/* Content right */}
      <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{
            backgroundColor: c.goldDim, padding: '4px 10px', borderRadius: 10,
            fontSize: 11, color: c.gold, fontWeight: 600,
          }}>{event.date}</span>
          <span style={{ fontSize: 12, color: c.mutedLight }}>
            {event.time}{event.end_time ? ` – ${event.end_time}` : ''}
          </span>
        </div>
        <h2 style={{
          fontSize: 38, fontWeight: 300, color: c.cream, margin: '0 0 12px',
          fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.15,
        }}>{event.title}</h2>
        <p style={{ fontSize: 13, color: c.muted, margin: '0 0 6px' }}>
          <span style={{ marginRight: 6 }}>◎</span>{event.location}
        </p>
        <p style={{ fontSize: 13, color: c.mutedLight, lineHeight: 1.6, margin: '0 0 20px' }}>
          {event.description}
        </p>

        {/* Capacity */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: c.muted, letterSpacing: 1 }}>{rsvpCount}/{event.capacity}</span>
            <span style={{ fontSize: 10, color: isFull ? '#EF4444' : c.mutedLight }}>
              {isFull ? 'FULL' : `${event.capacity - rsvpCount} spots left`}
            </span>
          </div>
          <div style={{ height: 2, backgroundColor: c.divider, borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: 2, backgroundColor: isFull ? '#EF4444' : c.gold,
              width: `${capacityPct}%`, transition: 'width 0.3s', borderRadius: 1 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isCancelled && (
            <button onClick={onRsvp} style={{
              backgroundColor: isRsvpd ? 'transparent' : (isFull ? c.divider : c.gold),
              color: isRsvpd ? c.gold : (isFull ? c.muted : c.bg),
              border: isRsvpd ? `1.5px solid ${c.gold}` : 'none',
              padding: '12px 28px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              letterSpacing: 2, cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
            }}>
              {isRsvpd ? '✓ CANCEL RSVP' : (isFull ? 'JOIN WAITLIST' : 'RSVP NOW')}
            </button>
          )}
          {isOwner && !isCancelled && (
            <button onClick={onCancel} style={{
              backgroundColor: 'transparent', color: '#EF4444',
              border: '1px solid #EF444440', padding: '12px 20px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer',
              fontFamily: "'Barlow', sans-serif",
            }}>CANCEL EVENT</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// REGULAR EVENT CARD
// ═══════════════════════════════════════════════════════════════════════
function WebEventCard({ event, isRsvpd, isOwner, onRsvp, onCancel }: {
  event: Event; isRsvpd: boolean; isOwner: boolean;
  onRsvp: () => void; onCancel: () => void;
}) {
  const typeColor = TYPE_COLORS[event.type] || c.gold;
  const rsvpCount = event.event_rsvps?.[0]?.count ?? 0;
  const isFull = rsvpCount >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  const isRescheduled = event.status === 'rescheduled';
  const capacityPct = Math.min((rsvpCount / event.capacity) * 100, 100);

  return (
    <div style={{
      backgroundColor: c.card, borderRadius: 16, border: `1px solid ${c.divider}`,
      opacity: isCancelled ? 0.5 : 1, overflow: 'hidden',
    }}>
      {/* Image */}
      <div style={{ height: 220, position: 'relative' }}>
        <img src={getEventImage(event)} alt={event.title} loading="lazy"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'brightness(0.85) saturate(0.9)',
          }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(14,12,9,0.8) 0%, transparent 50%)',
        }} />
        <span style={{
          position: 'absolute', top: 14, left: 14,
          backgroundColor: typeColor, padding: '5px 12px', borderRadius: 14,
          fontSize: 10, fontWeight: 700, color: c.bg, letterSpacing: 1,
        }}>{TYPE_LABELS[event.type]?.toUpperCase()}</span>
        {event.is_vip_only && (
          <span style={{
            position: 'absolute', top: 14, right: 14,
            backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: 14,
            fontSize: 10, fontWeight: 700, color: '#FAC775', letterSpacing: 1,
            border: '1px solid #FAC775',
          }}>VIP ONLY</span>
        )}
        {isCancelled && (
          <span style={{
            position: 'absolute', top: 14, right: 14,
            backgroundColor: '#EF4444', padding: '5px 10px', borderRadius: 14,
            fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1,
          }}>CANCELLED</span>
        )}
        {isRescheduled && !isCancelled && (
          <span style={{
            position: 'absolute', top: event.is_vip_only ? 44 : 14, right: 14,
            backgroundColor: '#F59E0B', padding: '5px 10px', borderRadius: 14,
            fontSize: 10, fontWeight: 700, color: c.bg, letterSpacing: 1,
          }}>RESCHEDULED</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            backgroundColor: c.goldDim, padding: '4px 10px', borderRadius: 10,
            fontSize: 11, color: c.gold, fontWeight: 600,
          }}>{event.date}</span>
          <span style={{ fontSize: 12, color: c.mutedLight }}>
            {event.time}{event.end_time ? ` – ${event.end_time}` : ''}
          </span>
        </div>
        <h3 style={{
          fontSize: 26, fontWeight: 400, color: c.cream, margin: '0 0 8px',
          fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2,
        }}>{event.title}</h3>
        <p style={{ fontSize: 13, color: c.muted, margin: '0 0 10px' }}>
          <span style={{ marginRight: 6 }}>◎</span>{event.location}
        </p>
        <p style={{
          fontSize: 13, color: c.mutedLight, lineHeight: 1.55, margin: '0 0 16px',
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>{event.description}</p>

        {isRescheduled && event.reschedule_note && (
          <div style={{
            backgroundColor: '#F59E0B10', borderRadius: 10, padding: 14,
            marginBottom: 16, borderLeft: '3px solid #F59E0B',
          }}>
            <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, margin: '0 0 4px' }}>Rescheduled</p>
            <p style={{ fontSize: 12, color: c.mutedLight, margin: 0 }}>{event.reschedule_note}</p>
          </div>
        )}

        {/* Capacity */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: c.muted, letterSpacing: 1 }}>{rsvpCount}/{event.capacity}</span>
            <span style={{ fontSize: 10, color: isFull ? '#EF4444' : c.mutedLight }}>
              {isFull ? 'FULL' : `${event.capacity - rsvpCount} spots left`}
            </span>
          </div>
          <div style={{ height: 2, backgroundColor: c.divider, borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: 2, backgroundColor: isFull ? '#EF4444' : c.gold,
              width: `${capacityPct}%`, transition: 'width 0.3s', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${c.divider}`, padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Avatar stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            rsvpCount > i ? (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: c.divider, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginLeft: i > 0 ? -8 : 0,
                border: `2px solid ${c.card}`, fontSize: 10, color: c.gold, fontWeight: 700,
              }}>{String.fromCharCode(65 + i)}</div>
            ) : null
          ))}
          {rsvpCount > 3 && (
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: c.goldDim, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginLeft: -8,
              border: `2px solid ${c.card}`, fontSize: 9, color: c.gold, fontWeight: 700,
            }}>+{rsvpCount - 3}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isOwner && !isCancelled && (
            <button onClick={onCancel} style={{
              backgroundColor: 'transparent', color: '#EF4444',
              border: '1px solid #EF444440', padding: '10px 16px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
              fontFamily: "'Barlow', sans-serif",
            }}>CANCEL</button>
          )}
          {!isCancelled && (
            <button onClick={onRsvp} style={{
              backgroundColor: isRsvpd ? 'transparent' : (isFull ? c.divider : c.gold),
              color: isRsvpd ? c.gold : (isFull ? c.muted : c.bg),
              border: isRsvpd ? `1.5px solid ${c.gold}` : 'none',
              padding: '10px 22px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              letterSpacing: 1.5, cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
            }}>
              {isRsvpd ? '✓ RSVP\'D' : (isFull ? 'WAITLIST' : 'RSVP')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CREATE EVENT FORM
// ═══════════════════════════════════════════════════════════════════════
function CreateEventForm({ userId, onCreated, onCancel }: {
  userId: string | null; onCreated: () => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('popup');
  const [location, setLocation] = useState('');
  const [virtualLink, setVirtualLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
      alert('Title, date, and time are required.'); return;
    }
    if (!userId) { alert('Please sign in first.'); return; }
    setSaving(true);
    try {
      const { error } = await createEvent({
        title: title.trim(), description: description.trim(), type,
        location: location.trim(),
        virtual_link: virtualLink.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        date: date.trim(), time: time.trim(),
        end_time: endTime.trim() || undefined,
        capacity: parseInt(capacity) || 50,
        is_vip_only: isVip, notify_members: notifyMembers,
      }, userId);
      if (error) throw error;
      onCreated();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: c.bg, color: c.cream, padding: 14, borderRadius: 8,
    fontSize: 14, border: `1px solid ${c.divider}`, width: '100%',
    boxSizing: 'border-box', outline: 'none', fontFamily: "'Barlow', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: c.muted, letterSpacing: 2, marginBottom: 8,
    display: 'block', fontFamily: "'Barlow', sans-serif",
  };

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: c.card, borderRadius: 16, border: `1px solid ${c.divider}`,
      padding: 32, marginBottom: 28,
    }}>
      <h3 style={{
        fontSize: 24, fontWeight: 300, color: c.cream, margin: '0 0 28px',
        fontFamily: "'Cormorant Garamond', serif",
      }}>New Event</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <div style={{ marginBottom: 20, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>TITLE *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Event title" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the event..." rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
        </div>

        {/* Type pills */}
        <div style={{ marginBottom: 20, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>TYPE</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EVENT_TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => setType(t.key as EventType)}
                style={{
                  backgroundColor: type === t.key ? TYPE_COLORS[t.key] + '30' : c.bg,
                  border: `1px solid ${type === t.key ? TYPE_COLORS[t.key] : c.divider}`,
                  color: type === t.key ? TYPE_COLORS[t.key] : c.muted,
                  padding: '8px 16px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                  letterSpacing: 1, cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                }}>
                <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>LOCATION</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Venue · City" style={inputStyle} />
        </div>
        {type === 'virtual' ? (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>VIRTUAL LINK</label>
            <input value={virtualLink} onChange={e => setVirtualLink(e.target.value)}
              placeholder="https://zoom.us/..." style={inputStyle} />
          </div>
        ) : <div />}

        {/* Image URL with preview */}
        <div style={{ marginBottom: 20, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>IMAGE URL</label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..." style={{ ...inputStyle, flex: 1 }} />
            {isValidImageUrl(imageUrl) && (
              <img src={imageUrl} alt="Preview"
                style={{
                  width: 80, height: 80, borderRadius: 8, objectFit: 'cover',
                  border: `1px solid ${c.divider}`, flexShrink: 0,
                }} />
            )}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>DATE *</label>
          <input value={date} onChange={e => setDate(e.target.value)}
            placeholder="e.g. Sat Jun 7, 2025" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>TIME *</label>
          <input value={time} onChange={e => setTime(e.target.value)}
            placeholder="e.g. 12:00 PM" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>END TIME</label>
          <input value={endTime} onChange={e => setEndTime(e.target.value)}
            placeholder="e.g. 6:00 PM" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>CAPACITY</label>
          <input value={capacity} onChange={e => setCapacity(e.target.value)}
            placeholder="50" type="number" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, marginBottom: 28 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.cream,
          fontSize: 13, cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
          <input type="checkbox" checked={isVip} onChange={e => setIsVip(e.target.checked)}
            style={{ accentColor: c.gold, width: 16, height: 16 }} />
          VIP Only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.cream,
          fontSize: 13, cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
          <input type="checkbox" checked={notifyMembers} onChange={e => setNotifyMembers(e.target.checked)}
            style={{ accentColor: c.gold, width: 16, height: 16 }} />
          Notify members on changes
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" disabled={saving} style={{
          backgroundColor: c.gold, color: c.bg, border: 'none',
          padding: '14px 28px', borderRadius: 8, fontSize: 12, fontWeight: 700,
          letterSpacing: 2, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1, fontFamily: "'Barlow', sans-serif",
        }}>{saving ? 'CREATING...' : 'CREATE EVENT'}</button>
        <button type="button" onClick={onCancel} style={{
          backgroundColor: 'transparent', color: c.muted,
          border: `1px solid ${c.divider}`, padding: '14px 28px', borderRadius: 8,
          fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
          fontFamily: "'Barlow', sans-serif",
        }}>CANCEL</button>
      </div>
    </form>
  );
}
