import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Props = ComponentProps<typeof Link> & {
  variant?: "default" | "muted" | "accent";
  external?: boolean;
  children: ReactNode;
};

export function ThemedLink({
  variant = "default",
  external,
  className = "",
  children,
  ...rest
}: Props) {
  const base = "transition-colors duration-200";
  const variants = {
    default: "text-[color:var(--ink)] hover:text-[color:var(--accent)]",
    muted:   "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
    accent:  "text-[color:var(--accent)] hover:text-[color:var(--ink)]",
  };

  if (external) {
    return (
      <a
        href={rest.href as string}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${variants[variant]} ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link {...rest} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
