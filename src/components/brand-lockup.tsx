import Image from "next/image";
import Link from "next/link";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 md:gap-3.5 ${className ?? ""}`}
      aria-label="The Forward Pass home"
    >
      <Image src="/logo.png" alt="" width={40} height={40} className="size-8 md:size-10" priority />
      <span className="wordmark text-xl md:text-[1.625rem]">THE FORWARD PASS</span>
    </Link>
  );
}
