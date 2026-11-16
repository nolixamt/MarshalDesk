import { HouseIcon, InboxIcon, type LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact: boolean;
};

export const navItems: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: HouseIcon, exact: true },
  { title: "Inbox", href: "/dashboard/inbox", icon: InboxIcon, exact: false },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getPageTitle(pathname: string): string {
  return navItems.find((item) => isNavItemActive(item, pathname))?.title ?? "";
}
