import { getSupabase } from './config.ts';

const downloadFile = async (storagePath: string): Promise<Uint8Array> => {
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return new Uint8Array(await data.arrayBuffer());
};

export { downloadFile };
