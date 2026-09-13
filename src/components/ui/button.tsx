import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const VARIANT_CLASSES = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
} as const;

const SIZE_CLASSES = {
  default: "px-4 py-2.5 text-sm",
  lg: "px-6 py-4 text-base",
} as const;

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 " +
  "disabled:opacity-50 disabled:pointer-events-none";

type Variant = keyof typeof VARIANT_CLASSES;
type Size = keyof typeof SIZE_CLASSES;

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: undefined;
    children: ReactNode;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  ...props
}: ButtonAsButton | ButtonAsLink) {
  const classes = cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);

  if (props.href) {
    const { href, children } = props;
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return <button className={classes} {...buttonProps} />;
}
