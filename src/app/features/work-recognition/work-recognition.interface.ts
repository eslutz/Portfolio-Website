export enum RecognitionType {
  Text = 'text',
  Image = 'image'
}

export interface WorkRecognition {
  id: string;
  component: string;
  companies: Company[];
}

interface Company {
  company: string;
  description: string;
  recognition: Recognition[];
}

interface Recognition {
  type: RecognitionType;
  date: string | null;
  description?: string;
  quote?: string;
  src?: string;
  alt?: string;
}
