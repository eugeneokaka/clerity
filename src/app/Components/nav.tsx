"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // ✅ your supabase client
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/signin");
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      {/* Logo / App name */}
      <Link href="/" className="text-xl font-bold tracking-tight text-black">
        Clarity
      </Link>

      {/* Right side buttons */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-700">
              Hi, {user.user_metadata?.full_name || user.email?.split("@")[0]}
            </span>
            <Button
              onClick={handleSignOut}
              className="bg-black text-white hover:bg-neutral-800"
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Link href="/signin">
              <Button className="bg-black text-white hover:bg-neutral-800">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-black text-white hover:bg-neutral-800">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
