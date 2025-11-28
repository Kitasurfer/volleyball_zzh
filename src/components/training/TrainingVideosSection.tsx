import React from 'react';
import type { TrainingVideo } from '../../hooks/useTrainingVideos';

interface TrainingVideosSectionProps {
  title: string;
  intro: string;
  loadingLabel: string;
  emptyLabel: string;
  errorPrefix: string;
  videos: TrainingVideo[];
  loading: boolean;
  error: string | null;
}

export const TrainingVideosSection: React.FC<TrainingVideosSectionProps> = ({
  title,
  intro,
  loadingLabel,
  emptyLabel,
  errorPrefix,
  videos,
  loading,
  error,
}) => (
  <div className="mt-12 max-w-5xl mx-auto">
    <h2 className="text-h3 font-semibold text-primary-900 mb-3">{title}</h2>
    <p className="text-body text-neutral-700 mb-6">{intro}</p>

    {loading ? (
      <div className="flex min-h-[160px] items-center justify-center text-sm text-neutral-500">
        {loadingLabel}
      </div>
    ) : error ? (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {errorPrefix} {error}
      </div>
    ) : videos.length === 0 ? (
      <div className="flex min-h-[160px] items-center justify-center text-sm text-neutral-500">
        {emptyLabel}
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="aspect-video w-full bg-black">
              {video.embedUrl ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.src}
                  controls
                  className="h-full w-full"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-body-lg font-semibold text-primary-900">{video.title}</h3>
              {video.description && (
                <p className="mt-2 text-body-sm text-neutral-700">{video.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
