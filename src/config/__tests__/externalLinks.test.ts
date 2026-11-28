import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOURCE_ATTRIBUTION,
  EXTERNAL_LINKS,
  openLibraryWorkUrl,
  resolveProvenanceLink,
} from "../externalLinks";

describe("externalLinks", () => {
  it("builds Open Library work URLs cleanly with or without leading /works/ prefix", () => {
    expect(openLibraryWorkUrl("OL52987W")).toBe("https://openlibrary.org/works/OL52987W");
    expect(openLibraryWorkUrl("/works/OL52987W")).toBe("https://openlibrary.org/works/OL52987W");
  });

  it("resolves published early childhood frameworks to their official portals", () => {
    expect(resolveProvenanceLink("DepEd MATATAG Kindergarten Curriculum")).toMatchObject({
      url: EXTERNAL_LINKS.depedMatatag,
      domainCaption: "deped.gov.ph",
    });
    expect(resolveProvenanceLink("Philippine ECCD Council NELF")).toMatchObject({
      url: EXTERNAL_LINKS.eccdCouncil,
      domainCaption: "eccdcouncil.gov.ph",
    });
    expect(resolveProvenanceLink("CDC Learn the Signs. Act Early.")).toMatchObject({
      url: EXTERNAL_LINKS.cdcMilestones,
      domainCaption: "cdc.gov",
    });
    expect(resolveProvenanceLink("WHO & UNICEF Nurturing Care")).toMatchObject({
      url: EXTERNAL_LINKS.whoNurturingCare,
      domainCaption: "nurturing-care.org",
    });
    expect(resolveProvenanceLink("AAP HealthyChildren guide")).toMatchObject({
      url: EXTERNAL_LINKS.aapHealthyChildren,
      domainCaption: "healthychildren.org",
    });
    expect(resolveProvenanceLink("Open Library picture books")).toMatchObject({
      url: EXTERNAL_LINKS.openLibrary,
      domainCaption: "openlibrary.org",
    });
  });

  it("falls back to default attribution for unrecognized sources", () => {
    expect(resolveProvenanceLink("Local caregiver routine")).toEqual({
      frameworkTitle: DEFAULT_SOURCE_ATTRIBUTION,
    });
  });
});
