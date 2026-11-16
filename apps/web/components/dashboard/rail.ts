// Collapsed, the sidebar is a 60px rail: 44px buttons inside the 8px group
// padding, with 20px icons. Expanded buttons keep the same 12px icon inset so
// icons don't shift sideways while the sidebar animates.
export const SIDEBAR_WIDTH_ICON = "60px";

export const railButtonClassName =
  "h-10 gap-3 px-3 [&_svg]:size-5 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-3!";

export const railTileButtonClassName =
  "h-12 p-1.5 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-1.5!";

export const railTooltipClassName = "data-instant:animate-none";
