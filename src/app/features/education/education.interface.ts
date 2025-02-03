export interface Education {
  degrees: Degree[];
  honors: {
    societies: { title: string; description: string; };
    lists: {
      list: { title: string; description: string; details: string; }[];
      link: { title: string; description: string; };
    };
  };
}

export interface Degree {
  institution: string;
  degree: string;
  honors: string | null;
  details: string | null;
  graduationYear: number;
  gpa: number;
}
