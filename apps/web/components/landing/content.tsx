import {
  BookOpenText,
  MessageCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const backgroundVideoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4";

export type NavLink = { label: string; href: string };

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export const signIn: NavLink = { label: "Sign in", href: "/dashboard" };

export type TrustItem = { label: string; icon: LucideIcon };

export const trust = {
  items: [
    { label: "Knowledge base", icon: BookOpenText },
    { label: "Conversation", icon: MessageCircle },
    { label: "Handoff", icon: UserRound },
  ] satisfies TrustItem[],
  claim: "Answers only from your knowledge base",
};

export const hero = {
  headline: ["Support that", "runs itself"],
  subhead:
    "Your agent answers visitors around the clock from your own knowledge base and brings you in only when it isn't sure. You get your day back.",
  cta: { label: "Get started", href: "/dashboard" },
};

export type Stat = {
  glyph: string;
  value: number;
  suffix: string;
  decimals: number;
  label: string;
};

export const stats: Stat[] = [
  {
    glyph: "<",
    value: 10,
    suffix: " min",
    decimals: 0,
    label: "From sign-up to a live widget",
  },
  {
    glyph: "%",
    value: 100,
    suffix: "%",
    decimals: 0,
    label: "Of messages classified first",
  },
  {
    glyph: "*",
    value: 24,
    suffix: "/7",
    decimals: 0,
    label: "Answers, even while you sleep",
  },
  {
    glyph: "#",
    value: 1,
    suffix: " snippet",
    decimals: 0,
    label: "To install on your site",
  },
];
