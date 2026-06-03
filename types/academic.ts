import type { ElementType } from "react";

export interface Program {
  title: string;
  subtitle: string;
  desc: string;
  icon: ElementType;
  /** Bolder, more detailed icon used as the faded watermark in the card. */
  bgIcon?: ElementType;
}
