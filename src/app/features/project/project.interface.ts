export interface Project {
  id: string;
  component: string;
  order: number;
  title: string;
  description: string;
  imageSrc: string | null;
  videoSrc: string | null;
  demoLink: string | null;
  demoLinkText: string | null;
  codeLink: string;
}
