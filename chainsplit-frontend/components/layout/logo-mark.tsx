import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-5 overflow-hidden rounded-full border border-[var(--cs-border-light)]",
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/chainsplit_logo_mark.png"
        alt=""
        fill
        sizes="24px"
        className="object-cover"
        unoptimized
      />
    </span>
  );
}
