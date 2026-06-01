import { Program } from "../types/academic";
import { RiStarSmileLine, RiBookOpenLine, RiLightbulbFlashLine, RiGraduationCapLine } from "@remixicon/react";

export const PROGRAMS: Program[] = [
  {
    title: "Early Years",
    subtitle: "Nursery–Prep",
    desc: "Fostering social and cognitive development through joyful, play-based exploration.",
    icon: RiStarSmileLine,
    iconClassName: "text-clay"
  },
  {
    title: "Primary",
    subtitle: "Grades 1–5",
    desc: "Experiential learning that builds a strong academic foundation and turns curiosity into rigour.",
    icon: RiBookOpenLine,
    iconClassName: "text-forest"
  },
  {
    title: "Middle",
    subtitle: "Grades 6–8",
    desc: "Developing critical thinking and independence through hands-on tinkering.",
    icon: RiLightbulbFlashLine,
    iconClassName: "text-clay"
  },
  {
    title: "Secondary",
    subtitle: "Grades 9–10",
    desc: "Rigorous CBSE preparation with deep inquiry, performing arts, and personalized mentoring.",
    icon: RiGraduationCapLine,
    iconClassName: "text-forest"
  }
];
