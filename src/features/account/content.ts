import { EXTERNAL_LINKS } from "../../config/externalLinks";

/** Project support and privacy inquiry reference shown on Privacy and Help pages. */
export const PRIVACY_CONTACT =
  "For privacy or support requests, reach the Thesis Titans project team via GitHub (github.com/Thesis-Titans).";

/** Published early childhood frameworks referenced by LittleSteps content. */
export const PUBLISHED_FRAMEWORKS = [
  {
    title: "CDC Developmental Milestones (Learn the Signs. Act Early.)",
    domain: "cdc.gov",
    url: EXTERNAL_LINKS.cdcMilestones,
  },
  {
    title: "American Academy of Pediatrics (AAP)",
    domain: "healthychildren.org",
    url: EXTERNAL_LINKS.aapHealthyChildren,
  },
  {
    title: "WHO & UNICEF Nurturing Care Framework",
    domain: "nurturing-care.org",
    url: EXTERNAL_LINKS.whoNurturingCare,
  },
  {
    title: "Philippine Early Learning Standards (ECCD Council)",
    domain: "eccdcouncil.gov.ph",
    url: EXTERNAL_LINKS.eccdCouncil,
  },
  {
    title: "DepEd MATATAG Kindergarten Curriculum",
    domain: "deped.gov.ph",
    url: EXTERNAL_LINKS.depedMatatag,
  },
] as const;

/** Every Account page route, shared between pages and route tests. */
export const ACCOUNT_PATHS = {
  menu: "/account",
  settings: "/account/settings",
  privacy: "/account/privacy",
  about: "/account/about",
  help: "/account/help",
} as const;
