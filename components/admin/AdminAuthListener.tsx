"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function AdminAuthListener() {
  const searchParams = useSearchParams();
  const toastedRef = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if ((error === "superadmin_required" || error === "access_denied") && !toastedRef.current) {
      toastedRef.current = true;
      toast.error("Access Denied: Superadmin privileges required.", {
        description: "You do not have permission to access the SuperAdmin suite.",
        duration: 5000,
      });

      // Clean query parameter from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  }, [searchParams]);

  return null;
}
