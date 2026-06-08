"use client";

import { useMemo } from "react";
import ReactSelect, { components } from "react-select";
import type { Props as ReactSelectProps, DropdownIndicatorProps, MenuProps } from "react-select";
import { motion } from "framer-motion";
import { RiArrowDownSLine } from "@remixicon/react";
import { EASE } from "@/lib/animations";

export interface SelectProps extends ReactSelectProps {
  error?: string;
}

const DropdownIndicator = (props: DropdownIndicatorProps) => (
  <components.DropdownIndicator {...props}>
    <motion.div
      animate={{ rotate: props.selectProps.menuIsOpen ? 180 : 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex items-center justify-center p-1"
    >
      <RiArrowDownSLine className="h-4 w-4 text-fg/40 transition-colors hover:text-fg/70" />
    </motion.div>
  </components.DropdownIndicator>
);

const Menu = (props: MenuProps) => (
  <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.25, ease: EASE }}
  >
    <components.Menu {...props} />
  </motion.div>
);

const getSelectClassNames = (error?: string) => ({
  control: ({ isFocused }: { isFocused: boolean }) => {
    const base = "w-full rounded-xl border px-3.5 py-2 text-xs transition-all duration-300";
    const focusClasses = isFocused ? "bg-surface ring-2 ring-clay/40 border-clay/50" : "bg-bg/60";
    const borderClasses = error
      ? "border-clay ring-2 ring-clay/30"
      : "border-fg/25 hover:border-fg/40";
    return `${base} ${focusClasses} ${borderClasses}`;
  },
  menu: () =>
    "mt-1.5 rounded-[14px] border border-fg/10 bg-surface/95 p-1 text-[0.7rem] shadow-lift backdrop-blur-xl z-50 overflow-hidden",
  menuList: () => "no-scrollbar max-h-[220px]",
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) => {
    const base =
      "w-full rounded-[10px] px-3 py-1.5 text-left text-[0.7rem] transition-all duration-200 cursor-pointer mb-px last:mb-0";
    if (isSelected) return `${base} bg-clay/10 font-semibold text-clay`;
    if (isFocused) return `${base} bg-ivory-2 text-fg font-medium`;
    return `${base} text-fg/70 hover:text-fg hover:bg-bg/40`;
  },
  placeholder: () => "text-muted/60 text-xs",
  singleValue: () => "text-fg text-xs",
  dropdownIndicator: () => "p-0",
  indicatorSeparator: () => "hidden",
  valueContainer: () => "p-0 m-0",
  input: () => "text-fg text-xs m-0 p-0",
});

export function Select({ error, ...props }: SelectProps) {
  const classNames = useMemo(() => getSelectClassNames(error), [error]);

  return (
    <ReactSelect
      unstyled
      classNames={classNames}
      components={{ DropdownIndicator, Menu }}
      menuPosition="fixed"
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      {...props}
    />
  );
}
