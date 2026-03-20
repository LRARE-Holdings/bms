"use client";

import { Elements } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import { getStripeClient } from "@/lib/stripe-client";

export default function StripeProvider({
  clientSecret,
  stripeAccountId,
  children,
}: {
  clientSecret: string;
  stripeAccountId?: string | null;
  children: React.ReactNode;
}) {
  const stripePromise = useMemo(
    () => getStripeClient(stripeAccountId),
    [stripeAccountId]
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#C4A95A",
            colorBackground: "#F5F0E8",
            colorText: "#4A4A4A",
            fontFamily: "DM Sans, system-ui, sans-serif",
            borderRadius: "12px",
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
