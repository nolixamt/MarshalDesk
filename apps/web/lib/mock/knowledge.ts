import type { Source } from "@marshaldesk/shared";

export const mockSources: Source[] = [
  {
    id: "src_faq",
    kind: "file",
    name: "FAQ.md",
    sizeBytes: 12_480,
    status: "ready",
    error: null,
    createdAt: "2026-11-10T09:00:00.000Z",
  },
  {
    id: "src_pricing",
    kind: "file",
    name: "Pricing and plans.pdf",
    sizeBytes: 1_153_024,
    status: "ready",
    error: null,
    createdAt: "2026-11-10T09:05:00.000Z",
  },
  {
    id: "src_scan",
    kind: "file",
    name: "Old brochure.pdf",
    sizeBytes: 2_411_724,
    status: "failed",
    error: "Couldn't find any text in this PDF. It may be a scan.",
    createdAt: "2026-11-10T09:10:00.000Z",
  },
];
