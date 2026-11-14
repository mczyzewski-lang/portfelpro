import type { Company } from "@/db/schema";
import { visibleVideo } from "./video";

export type CompanyInfo = {
  name: string; tagline: string; description: string; color: string; iconUrl: string | null; website: string | null;
  googleRating: number | null; googleReviews: number | null; googleUrl: string | null; videos: { title: string; url: string }[];
};

/** Dane firmy do okna „więcej o firmie”. Referencje z /demo/ są pokazywane tylko w trybie demo. */
export function companyInfo(c: Company): CompanyInfo {
  return {
    name: c.name, tagline: c.tagline, description: c.description, color: c.color, iconUrl: c.iconUrl, website: c.website,
    googleRating: c.googleRating, googleReviews: c.googleReviews, googleUrl: c.googleUrl,
    videos: c.referenceVideos.filter((v) => visibleVideo(v.url)),
  };
}
