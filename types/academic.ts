import type { ElementType } from "react";

export interface Program {
  title: string;
  subtitle: string;
  desc: string;
  icon: ElementType;
  /** 3D illustration shown in the card's tinted side panel. */
  image: string;
}
