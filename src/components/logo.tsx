import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  size = "md",
  name = "Dapur Bu Aina",
  tagline = "Citarasa Warisan Keluarga",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  name?: string;
  tagline?: string;
}) {
  const px = size === "lg" ? 120 : size === "sm" ? 40 : 48;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/brand/logo.png"
        alt={name}
        width={px}
        height={px}
        priority
        className="shrink-0 rounded-full"
        style={{ width: px, height: px }}
      />
      {showText && (
        <div className="leading-tight">
          <p className="font-serif text-lg font-bold text-brand-teal">{name}</p>
          <p className="text-xs text-brand-wood">{tagline}</p>
        </div>
      )}
    </div>
  );
}
