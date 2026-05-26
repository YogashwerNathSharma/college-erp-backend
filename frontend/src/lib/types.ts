export interface SiteContent {
  schoolName?: string;
  addressLine1?: string;
  heroSubtitle?: string;
  aboutHeading?: string;
  aboutBody?: string;
  principalName?: string;
  principalMessage?: string;
  principalImagePath?: string;
  heroImagePath?: string;
}

export interface GalleryImage {
  id: string;
  imagePath: string;
  caption?: string;
}