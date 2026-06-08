import type { ComponentType } from "react";

import type { View } from "../portal-types";

export type NavItem = {
  key: View;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function SidebarButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: (view: View) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(item.key)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-fg/[0.07] text-fg" : "text-muted hover:bg-fg/[0.04] hover:text-fg"
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </button>
  );
}

export function MobileNavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: (view: View) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(item.key)}
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
        active
          ? "border-clay/40 bg-clay/10 text-clay"
          : "border-line bg-surface text-muted hover:text-fg"
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </button>
  );
}
