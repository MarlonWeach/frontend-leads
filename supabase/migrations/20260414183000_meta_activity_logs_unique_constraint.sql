-- Ensure upsert ON CONFLICT works for meta activity logs sync job
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meta_activity_logs_unique_event'
      AND conrelid = 'public.meta_activity_logs'::regclass
  ) THEN
    ALTER TABLE public.meta_activity_logs
      ADD CONSTRAINT meta_activity_logs_unique_event
      UNIQUE (account_id, event_type, event_time, object_id);
  END IF;
END
$$;
