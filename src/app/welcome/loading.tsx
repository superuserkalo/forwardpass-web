import { FormPageSkeleton } from "@/components/archive/skeletons";
import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main>
        <FormPageSkeleton />
      </main>
    </>
  );
}
