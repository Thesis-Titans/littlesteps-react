/**
 * Centralized external reference, attribution, and support URLs used across LittleSteps.
 */
export const EXTERNAL_LINKS = {
  /** Philippine Early Childhood Care and Development (ECCD) Council portal. */
  eccdCouncil: "https://eccdcouncil.gov.ph",
  /** Department of Education (DepEd) MATATAG Kindergarten Curriculum portal. */
  depedMatatag: "https://www.deped.gov.ph/matatagcurriculumk147/",
  /** US CDC Learn the Signs. Act Early. developmental milestones portal. */
  cdcMilestones: "https://www.cdc.gov/ncbddd/actearly/milestones/",
  /** WHO and UNICEF Nurturing Care Framework portal. */
  whoNurturingCare: "https://nurturing-care.org",
  /** American Academy of Pediatrics caregiver guidance portal. */
  aapHealthyChildren: "https://www.healthychildren.org",
  /** Open-Meteo weather data attribution website. */
  openMeteo: "https://open-meteo.com",
  /** Open Library picture-book catalog website. */
  openLibrary: "https://openlibrary.org",
  /** Project organization page for documentation and support. */
  githubOrg: "https://github.com/Thesis-Titans",
} as const;

/** Default source attribution shown when an activity carries no specific citation string. */
export const DEFAULT_SOURCE_ATTRIBUTION = "Early childhood learning guide";

/** Standard calm, non-diagnostic disclaimer shown alongside play ideas and adaptations. */
export const NON_DIAGNOSTIC_PLAY_DISCLAIMER =
  "Everyday play idea only — not a medical or developmental test.";

/** Returns the Open Library work URL for a work identifier (e.g. `OL52987W`). */
export function openLibraryWorkUrl(workId: string): string {
  const cleanId = workId.replace(/^\/works\//, "");
  return `${EXTERNAL_LINKS.openLibrary}/works/${encodeURIComponent(cleanId)}`;
}

/** Resolved metadata for an external early childhood framework citation. */
export interface ProvenanceLinkInfo {
  frameworkTitle: string;
  url?: string;
  buttonLabel?: string;
  domainCaption?: string;
}

/** Resolves a citation string to its published framework title and link metadata. */
export function resolveProvenanceLink(provenanceSource: string): ProvenanceLinkInfo {
  if (provenanceSource.includes("MATATAG") || provenanceSource.includes("DepEd")) {
    return {
      frameworkTitle: "DepEd MATATAG Kindergarten Curriculum",
      url: EXTERNAL_LINKS.depedMatatag,
      buttonLabel: "Visit DepEd MATATAG portal",
      domainCaption: "deped.gov.ph",
    };
  }
  if (provenanceSource.includes("NELF")) {
    return {
      frameworkTitle: "Philippine National Early Learning Framework (NELF)",
      url: EXTERNAL_LINKS.eccdCouncil,
      buttonLabel: "Visit ECCD Council website",
      domainCaption: "eccdcouncil.gov.ph",
    };
  }
  if (provenanceSource.includes("NELC")) {
    return {
      frameworkTitle: "Philippine National Early Learning Curriculum (NELC)",
      url: EXTERNAL_LINKS.eccdCouncil,
      buttonLabel: "Visit ECCD Council website",
      domainCaption: "eccdcouncil.gov.ph",
    };
  }
  if (provenanceSource.includes("ECCD")) {
    return {
      frameworkTitle: "Early Childhood Care and Development (ECCD) Council",
      url: EXTERNAL_LINKS.eccdCouncil,
      buttonLabel: "Visit ECCD Council website",
      domainCaption: "eccdcouncil.gov.ph",
    };
  }
  if (provenanceSource.includes("CDC")) {
    return {
      frameworkTitle: "CDC Developmental Milestones",
      url: EXTERNAL_LINKS.cdcMilestones,
      buttonLabel: "Visit CDC website",
      domainCaption: "cdc.gov",
    };
  }
  if (provenanceSource.includes("WHO") || provenanceSource.includes("UNICEF")) {
    return {
      frameworkTitle: "WHO & UNICEF Nurturing Care Framework",
      url: EXTERNAL_LINKS.whoNurturingCare,
      buttonLabel: "Visit Nurturing Care website",
      domainCaption: "nurturing-care.org",
    };
  }
  if (provenanceSource.includes("AAP")) {
    return {
      frameworkTitle: "American Academy of Pediatrics (AAP)",
      url: EXTERNAL_LINKS.aapHealthyChildren,
      buttonLabel: "Visit AAP website",
      domainCaption: "healthychildren.org",
    };
  }
  if (provenanceSource.includes("Open Library")) {
    return {
      frameworkTitle: "Open Library",
      url: EXTERNAL_LINKS.openLibrary,
      buttonLabel: "Visit Open Library",
      domainCaption: "openlibrary.org",
    };
  }
  return {
    frameworkTitle: DEFAULT_SOURCE_ATTRIBUTION,
  };
}
