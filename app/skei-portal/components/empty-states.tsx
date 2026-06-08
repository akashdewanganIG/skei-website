import { RiInboxLine } from "@remixicon/react";

export function EmptyState({ hasLeads }: { hasLeads: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <RiInboxLine className="h-10 w-10 text-muted/50" />
      <p className="mt-3 text-sm font-medium text-fg">
        {hasLeads ? "No leads match your filters" : "No leads yet"}
      </p>
      <p className="mt-1 text-xs text-muted">
        {hasLeads ? "Try clearing the filters." : "New enquiries will appear here."}
      </p>
    </div>
  );
}

export function EmptyInline({ text }: { text: string }) {
  return <div className="p-4 text-sm text-muted">{text}</div>;
}
