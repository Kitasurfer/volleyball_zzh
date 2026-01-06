-- Reset referee gestures vector job to pending to trigger re-ingestion
DO $$
BEGIN
    -- Check if the job exists
    IF EXISTS (SELECT 1 FROM public.vector_jobs WHERE content_id = 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d') THEN
        UPDATE public.vector_jobs
        SET status = 'pending',
            error = NULL,
            started_at = NULL,
            completed_at = NULL,
            updated_at = now()
        WHERE content_id = 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d';
    ELSE
        -- If it doesn't exist, create it
        INSERT INTO public.vector_jobs (content_id, status, payload)
        VALUES ('a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d', 'pending', '{"reason": "manual_reset"}'::jsonb);
    END IF;
END $$;
