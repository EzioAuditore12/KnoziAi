export type Chunk = {
  text: string;
  metadata?: {
    orig_elements?: any[];
  };
};

export type ContentData = {
  text: string;
  tables: string[];
  images: string[];
  imageDataUrls: string[];
  types: string[];
};

export type EmbeddingMetaData = {
  text: string;
  tables: string[];
  images: string[];
};
