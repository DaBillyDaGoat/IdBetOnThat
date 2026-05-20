"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function GeoContinueButton({ next }: { next: string }) {
  const router = useRouter();
  return (
    <Button
      size="lg"
      onClick={() => {
        // 30-day acknowledgment.
        document.cookie = `geo-ack=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        router.push(next || "/");
      }}
    >
      Continue anyway
    </Button>
  );
}
