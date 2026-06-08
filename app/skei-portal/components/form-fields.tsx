"use client";

import { Select } from "@/components/ui/select";
import type { SelectOption } from "../portal-types";

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-line bg-bg/45 px-3 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  instanceId,
  options,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  instanceId: string;
  options: SelectOption<T>[];
  value: SelectOption<T>;
  disabled?: boolean;
  onChange: (option: SelectOption<T>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className={disabled ? "cursor-not-allowed opacity-60" : undefined}>
        <Select
          instanceId={instanceId}
          options={options}
          value={value}
          isSearchable={false}
          isDisabled={disabled}
          onChange={(option: unknown) => {
            const next = option as SelectOption<T> | null;
            if (next) onChange(next);
          }}
        />
      </div>
    </div>
  );
}
