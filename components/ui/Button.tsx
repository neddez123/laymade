import Link from "next/link";
import type { ReactNode } from "react";

type CommonProps = {
  variant?: "primary" | "ghost";
  children: ReactNode;
  className?: string;
};

type AsButton = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
};

type AsLink = CommonProps & {
  href: string;
  external?: boolean;
};

type Props = AsButton | AsLink;

export function Button(props: Props) {
  const { variant = "primary", children, className = "" } = props;

  const base =
    "inline-flex items-center gap-2 px-5 py-3 text-[12px] tracking-[0.08em] uppercase font-medium btn-press border";
  const variants = {
    primary:
      "bg-[color:var(--ink)] text-[color:var(--bg)] border-[color:var(--ink)] hover:bg-[color:var(--accent)] hover:border-[color:var(--accent)]",
    ghost:
      "bg-transparent text-[color:var(--ink)] border-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--bg)]",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if ("href" in props && props.href) {
    if ("external" in props && props.external) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={(props as AsButton).type ?? "button"}
      onClick={(props as AsButton).onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
