export interface Project {
  id: string;
  component: string;
  order: number;
  title: string;
  description: string;
  imageSrc?: string;
  videoSrc?: string;
  demoLink?: string;
  demoLinkText?: string;
  codeLink: string;
}
