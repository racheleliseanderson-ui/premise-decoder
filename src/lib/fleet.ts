/**
 * Northern Lantern House fleet link registry (Fleet Shell Standard v1 §5).
 * Publication and app names stay in English in every interface language.
 */

export const HOUSE_URL = "https://northernlanternhouse.com";
export const HOUSE_NAME = "Northern Lantern House Labs";

export type FleetLink = { name: string; url: string };
export type FleetGroup = { publication: FleetLink; apps: FleetLink[] };

export const SALTY: FleetGroup = {
  publication: { name: "Salty & Clever", url: "https://saltnotes.blog" },
  apps: [
    { name: "Salty Desk", url: "https://salty.saltnotes.blog" },
    { name: "Kitchen & Bar", url: "https://kitchen.saltnotes.blog" },
    { name: "Menu Builder", url: "https://occasion.saltnotes.blog/architecture" },
    { name: "Occasion OS", url: "https://occasion.saltnotes.blog" },
    { name: "Restaurant Intelligence", url: "https://deepdish.saltnotes.blog" },
  ],
};

export const THISTLE: FleetGroup = {
  publication: { name: "Tangled Thistle", url: "https://tangledthistle.blog" },
  apps: [
    { name: "Atmosphere OS", url: "https://atmosphere.tangledthistle.blog" },
    { name: "Venue Intelligence", url: "https://venue.tangledthistle.blog" },
  ],
};

/** This app's own publication. */
export const VANITY: FleetGroup = {
  publication: { name: "Vanity or Vice", url: "https://vanityvice.blog" },
  apps: [
    { name: "Makeup Intelligence", url: "https://makeup.vanityvice.blog" },
    { name: "Skincare Desk", url: "https://skincare.vanityvice.blog" },
    { name: "Spa Intelligence", url: "https://spa.vanityvice.blog" },
  ],
};

export const SINGLES: FleetLink[] = [
  { name: "Room for Drama", url: "https://dramaroom.blog" },
  { name: "Hook the Horizon", url: "https://hookthehorizon.blog" },
  { name: "Elsewhere, Apparently", url: "https://the-money-apparently.vercel.app" },
];

/** Everything except this publication, for the "Across the fleet" column. */
export const ACROSS_FLEET: FleetGroup[] = [SALTY, THISTLE];

export const THIS_APP = "Spa Intelligence";
