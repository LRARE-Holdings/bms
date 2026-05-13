"use client";

import type { ReactNode } from "react";
import { useMemberProfile } from "./member-profile-context";

export default function MemberNameButton({
  profileId,
  className = "",
  children,
}: {
  profileId: string;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useMemberProfile();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        open(profileId);
      }}
      className={`text-left hover:text-gold transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
