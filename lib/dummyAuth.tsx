// lib/dummyAuth.tsx
"use client";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export function DummyAuthProvider({ children }: { children: React.ReactNode }) {
  // no-op provider så gamle imports ikke crasher
  return <>{children}</>;
}

export function useDummySession() {
  const { data, status } = useSession();
  return {
    user: data?.user ?? null,
    status,
    signIn: (prov: string = "discord") => signIn(prov),
    signOut,
  };
}
