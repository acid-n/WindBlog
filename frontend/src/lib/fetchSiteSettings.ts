import { fetchJson } from "@/lib/getBaseUrl";

export interface SiteSettings {
  title: string;
  tagline: string;
}

export async function fetchSiteSettings() {
  return fetchJson<SiteSettings>("/site-settings/");
}
