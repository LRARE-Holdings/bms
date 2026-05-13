"use client";

import { useCallback, useState, type ReactNode } from "react";
import MemberProfileModal from "./member-profile-modal";
import {
  MemberProfileContext,
  CLOSE_POPUPS_EVENT,
} from "./member-profile-context";

export default function MemberProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profileId, setProfileId] = useState<string | null>(null);

  const open = useCallback((id: string) => {
    // Close any other open popup first — dominant behaviour.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CLOSE_POPUPS_EVENT));
    }
    setProfileId(id);
  }, []);

  const close = useCallback(() => {
    setProfileId(null);
  }, []);

  return (
    <MemberProfileContext value={{ open, close }}>
      {children}
      {profileId && (
        <MemberProfileModal
          key={profileId}
          profileId={profileId}
          onClose={close}
        />
      )}
    </MemberProfileContext>
  );
}
