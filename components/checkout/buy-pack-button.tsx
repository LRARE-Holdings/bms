"use client";

import { useState } from "react";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { useRouter } from "next/navigation";

export default function BuyPackButton({
  tierId,
  profileId,
  className,
  children,
}: {
  tierId: string;
  profileId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [showCheckout, setShowCheckout] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowCheckout(true)}
        className={className}
      >
        {children}
      </button>
      {showCheckout && (
        <CheckoutModal
          type="pack"
          tierId={tierId}
          profileId={profileId}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
