import {
  RiBookOpenLine,
  RiGraduationCapLine,
  RiLightbulbFlashLine,
  RiStarSmileLine,
} from "@remixicon/react";
import type { Program } from "../types/academic";

export const PROGRAMS: Program[] = [
  {
    title: "Early Years",
    subtitle: "Nursery–Prep",
    desc: "Our Montessori-inspired play school spans nursery and kindergarten, nurturing social and cognitive growth through joyful play.",
    icon: RiStarSmileLine,
    image: "/academic-card/A1.png",
  },
  {
    title: "Primary",
    subtitle: "Grades 1–5",
    desc: "Experiential learning that builds a strong academic foundation and turns curiosity into rigour.",
    icon: RiBookOpenLine,
    image: "/academic-card/A2.png",
  },
  {
    title: "Middle",
    subtitle: "Grades 6–8",
    desc: "Developing critical thinking and independence through hands-on tinkering.",
    icon: RiLightbulbFlashLine,
    image: "/academic-card/A3.png",
  },
  {
    title: "Secondary",
    subtitle: "Grades 9–10",
    desc: "Rigorous CBSE preparation with deep inquiry, performing arts, and personalized mentoring.",
    icon: RiGraduationCapLine,
    image: "/academic-card/A4.png",
  },
];
