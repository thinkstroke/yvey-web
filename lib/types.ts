export type EventType = 'popup' | 'workshop' | 'editorial' | 'vip' | 'virtual';
export type EventStatus = 'upcoming' | 'cancelled' | 'rescheduled' | 'completed';
export type RsvpStatus = 'confirmed' | 'waitlist' | 'cancelled';
export type NotificationType =
  | 'rsvp_confirmed' | 'event_cancelled' | 'event_rescheduled' | 'event_reminder';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  location: string;
  virtual_link?: string;
  image_url?: string;
  date: string;
  time: string;
  end_time?: string;
  capacity: number;
  is_vip_only: boolean;
  status: EventStatus;
  reschedule_note?: string;
  notify_members: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  event_rsvps?: { count: number }[];
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  profiles?: { full_name: string; email: string; hair_type?: string };
}

export interface EventNotification {
  id: string;
  event_id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
  events?: { title: string };
}
