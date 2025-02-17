export interface Education {
  id: string;
  component: string;
  degrees: Degree[];
  honors: Honors;
}

interface Degree {
  institution: string;
  degree: string;
  honors?: string;
  details?: string;
  graduationYear: number;
  gpa: number;
}
interface Honors {
  societies: Society;
  lists: HonorLists;
}

interface Society {
  title: string;
  description: string;
}

interface HonorLists {
  list: List[];
  link: Link;
}

interface List {
  title: string;
  description: string;
  details: string;
}

interface Link {
  title: string;
  description: string;
}
