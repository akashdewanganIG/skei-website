import type { Program } from "../types/academic";
import {
  RiStarSmileLine,
  RiBookOpenLine,
  RiLightbulbFlashLine,
  RiGraduationCapLine,
  RiBearSmileLine,
  RiQuillPenLine,
  RiFlaskLine,
  RiMedalLine,
} from "@remixicon/react";

export const PROGRAMS: Program[] = [
  {
    title: "Early Years",
    subtitle: "Nursery–Prep",
    desc: "Our Montessori-inspired play school spans nursery and kindergarten, nurturing social and cognitive growth through joyful play.",
    icon: RiStarSmileLine,
    bgIcon: RiBearSmileLine,
  },
  {
    title: "Primary",
    subtitle: "Grades 1–5",
    desc: "Experiential learning that builds a strong academic foundation and turns curiosity into rigour.",
    icon: RiBookOpenLine,
    bgIcon: RiQuillPenLine,
  },
  {
    title: "Middle",
    subtitle: "Grades 6–8",
    desc: "Developing critical thinking and independence through hands-on tinkering.",
    icon: RiLightbulbFlashLine,
    bgIcon: RiFlaskLine,
  },
  {
    title: "Secondary",
    subtitle: "Grades 9–10",
    desc: "Rigorous CBSE preparation with deep inquiry, performing arts, and personalized mentoring.",
    icon: RiGraduationCapLine,
    bgIcon: RiMedalLine,
  },
];
