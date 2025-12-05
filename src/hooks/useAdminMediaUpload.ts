import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

const MEDIA_BUCKET = 'media-public';

export type MediaSourceType = 'file' | 'url';

interface UseAdminMediaUploadOptions {
  onUploaded?: () => void;
}

interface UseAdminMediaUploadResult {
  files: File[];
  setFiles: (files: File[]) => void;
  sourceType: MediaSourceType;
  setSourceType: (value: MediaSourceType) => void;
  url: string;
  setUrl: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  language: 'all' | string;
  setLanguage: (value: 'all' | string) => void;
  albumId: 'none' | string;
  setAlbumId: (value: 'none' | string) => void;
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  handleUpload: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

const inferMediaType = (selectedFile: File): string => {
  if (selectedFile.type.startsWith('image/')) return 'image';
  if (selectedFile.type.startsWith('video/')) return 'video';
  if (selectedFile.type.startsWith('audio/')) return 'audio';
  if (selectedFile.type === 'application/pdf') return 'document';
  return selectedFile.type || 'other';
};

const inferMediaTypeFromUrl = (value: string): string => {
  const lower = value.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|avif|heic|heif)(\?|#|$)/.test(lower)) return 'image';
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/.test(lower)) return 'video';
  if (/\.(mp3|wav|aac|flac|oga)(\?|#|$)/.test(lower)) return 'audio';
  if (/\.(pdf)(\?|#|$)/.test(lower)) return 'document';
  return 'other';
};

export const useAdminMediaUpload = (
  options: UseAdminMediaUploadOptions = {},
): UseAdminMediaUploadResult => {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceType, setSourceType] = useState<MediaSourceType>('file');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'all' | string>('all');
  const [albumId, setAlbumId] = useState<'none' | string>('none');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (sourceType === 'file' && files.length === 0) {
      setUploadError('Select at least one file to upload or switch to URL mode.');
      return;
    }

    if (sourceType === 'url') {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setUploadError('Enter a URL to create a media item.');
        return;
      }
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        setUploadError('URL must start with http:// or https://');
        return;
      }
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const langKey = language === 'de' || language === 'en' || language === 'ru' ? language : null;

    try {
      if (sourceType === 'file' && files.length > 0) {
        for (const file of files) {
          const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const randomSuffix = Math.random().toString(36).slice(2, 8);
          const path = `uploads/${Date.now()}-${randomSuffix}.${extension}`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(path, file, { upsert: false });

          if (uploadErr) {
            setUploadError(uploadErr.message);
            setUploading(false);
            return;
          }

          const storagePath = `${MEDIA_BUCKET}/${uploadData?.path ?? path}`;
          const baseTitle = title || sanitizedName;

          const { error: insertError } = await supabase.from('media_assets').insert({
            storage_path: storagePath,
            title: baseTitle,
            description: description || null,
            language: language === 'all' ? null : language,
            media_type: inferMediaType(file),
            album_id: albumId === 'none' ? null : albumId,
            alt_text: langKey ? { [langKey]: baseTitle } : {},
            title_i18n: langKey ? { [langKey]: baseTitle } : {},
          });

          if (insertError) {
            setUploadError(insertError.message);
            setUploading(false);
            return;
          }
        }
      }

      if (sourceType === 'url') {
        const trimmedUrl = url.trim();
        const baseTitle = title || trimmedUrl;
        const mediaType = inferMediaTypeFromUrl(trimmedUrl);

        const { error: insertError } = await supabase.from('media_assets').insert({
          storage_path: trimmedUrl,
          title: baseTitle,
          description: description || null,
          language: language === 'all' ? null : language,
          media_type: mediaType,
          album_id: albumId === 'none' ? null : albumId,
          alt_text: langKey ? { [langKey]: baseTitle } : {},
          title_i18n: langKey ? { [langKey]: baseTitle } : {},
        });

        if (insertError) {
          setUploadError(insertError.message);
          setUploading(false);
          return;
        }
      }

      setUploadSuccess('Media asset saved successfully.');
      setFiles([]);
      setUrl('');
      setTitle('');
      setDescription('');
      setLanguage('all');
      setAlbumId('none');

      if (options.onUploaded) {
        options.onUploaded();
      }

      setUploading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save media asset.';
      setUploadError(message);
      setUploading(false);
    }
  };

  return {
    files,
    setFiles,
    sourceType,
    setSourceType,
    url,
    setUrl,
    title,
    setTitle,
    description,
    setDescription,
    language,
    setLanguage,
    albumId,
    setAlbumId,
    uploading,
    uploadError,
    uploadSuccess,
    handleUpload,
  };
};
