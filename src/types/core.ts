export interface MessageReactionEvent {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface SupabaseRealtimeChangePayload<T> {
  schema: string;
  errors: string[] | null;
  eventType: string;
  new: T;
  old: T;
  table: string;
}
