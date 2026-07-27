import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100",
  ghost: "text-gray-600 hover:bg-gray-100 active:bg-gray-200",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
