export enum RecognitionType {
  Text = 'Text',
  Image = 'Image',
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
  date?: string;
  description?: string;
  quote?: string;
  src?: string;
  alt?: string;
}
