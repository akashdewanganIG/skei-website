import Image from "next/image";
import logoLight from "@/public/logo-light.png";
import logoDark from "@/public/logo-dark.png";

/**
 * Brand logo that swaps with the theme: the dark logo on light backgrounds, the
 * light logo on dark backgrounds. Both are rendered and toggled with CSS (no
 * hydration flicker). `unoptimized` serves the original file so it stays crisp.
 */
export function BrandLogo({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={logoDark}
        alt="SKEI - Best CBSE School in Bangalore"
        priority={priority}
        unoptimized
        className={`logo-on-light ${className}`}
      />
      <Image
        src={logoLight}
        alt="SKEI - Best CBSE School in Bangalore"
        priority={priority}
        unoptimized
        className={`logo-on-dark ${className}`}
      />
    </>
  );
}
