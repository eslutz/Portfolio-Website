export enum RecognitionType {
  Text = 'text',
  Image = 'image'
}

export interface WorkRecognition {
  company: string;
  description: string;
  recognition: Recognition[];
}

export interface Recognition {
  type: RecognitionType;
  date: string | null;
  description?: string;
  quote?: string;
  src?: string;
  alt?: string;
}
