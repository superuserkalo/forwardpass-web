import Image from "next/image";
import Link from "next/link";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 ${className ?? ""}`}
      aria-label="The Forward Pass home"
    >
      <Image src="/logo.png" alt="" width={28} height={28} className="size-7" priority />
      <span className="wordmark">THE FORWARD PASS</span>
    </Link>
  );
}
