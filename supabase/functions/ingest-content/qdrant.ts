import { getPublicStorageBase, getQdrantClient, getCollectionName } from './config.ts';
import type { MediaLink, Chunk, MediaPayload } from './types.ts';

const extractPicturePositionsFromRefs = (refs?: string[]): number[] => {
  if (!refs || refs.length === 0) return [];

  const positions = refs
    .filter((ref) => ref.startsWith('#/pictures/'))
    .map((ref) => {
      const parts = ref.split('/');
      const idxStr = parts[2];
      const idx = Number(idxStr);
      if (!Number.isFinite(idx)) return null;
      return idx + 1;
    })
    .filter((value): value is number => value !== null);

  return Array.from(new Set(positions));
};

const chunkSnippet = (text: string, limit = 1500): string =>
  text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;

const toMediaPayload = (links: MediaLink[], chunk?: Chunk): MediaPayload[] => {
  const positionsFromRefs = extractPicturePositionsFromRefs(chunk?.docItemsRefs);

  const filteredLinks =
    positionsFromRefs.length > 0
      ? links.filter((item) => {
          const metaPos = (item.metadata as any)?.docling_position ?? item.position;
          return positionsFromRefs.includes(metaPos);
        })
      : links;

  return filteredLinks.map((item) => ({
    id: item.media_id,
    url: `${getPublicStorageBase()}${item.storage_path}`,
    type: item.media_type,
    title: item.title ?? undefined,
    description: item.description ?? undefined,
    classification: (item.metadata as any)?.classification ?? undefined,
  }));
};

// Generate a proper UUID for Qdrant points
const generatePointId = (): string => {
  return crypto.randomUUID();
};

const upsertQdrant = async (points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>) => {
  await getQdrantClient().upsert(getCollectionName(), { points });
};

export { extractPicturePositionsFromRefs, chunkSnippet, toMediaPayload, generatePointId, upsertQdrant };
