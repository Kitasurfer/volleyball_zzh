import { getSupabase } from './config.ts';

const enqueueVectorJob = async (contentId: string): Promise<void> => {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('vector_jobs')
    .insert({
      content_id: contentId,
      status: 'pending',
    });

  if (error) {
    throw new Error(`Failed to enqueue vector job: ${error.message}`);
  }
};

export { enqueueVectorJob };
