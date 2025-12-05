export interface DoclingChunk {
  text: string;
  headings: string[];
}

export interface DoclingResponse {
  markdown: string;
  metadata: {
    pages: number;
    figures: number;
    tables: number;
  };
  images: string[];
  error?: string;
}

export interface RequestBody {
  storage_path: string;
  language: string;
  type: string;
  title: string;
  tags?: string[];
}
