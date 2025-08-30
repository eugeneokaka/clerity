"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallback() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const exchangeCode = async () => {
      // This exchanges the ?code=... for a Supabase session cookie
      await supabase.auth.getSession();
      router.replace("/"); // redirect to home without the query params
    };

    exchangeCode();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-700">Signing you in...</p>
    </div>
  );
}
