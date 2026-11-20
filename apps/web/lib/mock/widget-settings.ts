import type { SetupProgress, WidgetSettings } from "@marshaldesk/shared";

export const mockWidgetSettings: WidgetSettings = {
  position: "bottom-right",
  color: "blue",
  agentName: "Acme Agent",
  agentAvatarUrl: null,
  greeting: "Hi there! How can we help you today?",
  allowedDomains: ["acme.com", "www.acme.com"],
};

export const mockSetupProgress: SetupProgress = {
  hasReadySource: true,
  hasAllowedDomain: true,
  snippetInstalled: false,
};

export const mockSuggestedQuestions: string[] = [
  "How do I reset my password?",
  "What's your refund policy?",
  "Do you ship to Canada?",
  "How much is the Pro plan?",
];

export const mockWorkspaceId = "8f3c2a1e-5b7d-4e9a-a1c2-3d4e5f6a7b8c";
