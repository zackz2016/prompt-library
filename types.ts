export enum GenerationType {
  TextToImage = 'Text To Image',
  ImageToImage = 'Image To Image',
}

export interface PromptEntry {
  id: string;
  original_prompt: string;
  translated_prompt: string;
  summary: string;
  image_url: string | null;
  aspect_ratio: string;
  tags: string[];
  generation_type: GenerationType;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface AnalysisResult {
  cn: string;
  en: string;
  summary: string;
}
