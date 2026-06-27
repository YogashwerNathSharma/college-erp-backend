import { useEffect, useState } from "react";

/**
 * Lazily loads the Razorpay checkout script only when needed.
 * Use this hook in payment pages (FeeCollectionPage, SubscriptionsPage, etc.)
 * 
 * Usage:
 *   const razorpayLoaded = useRazorpay();
 *   
 *   const handlePayment = () => {
 *     if (!razorpayLoaded) { toast.error("Payment loading..."); return; }
 *     // proceed with Razorpay
 *   };
 */
export function useRazorpay() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if ((window as any).Razorpay) {
      setLoaded(true);
      return;
    }

    // Check if script tag already exists
    if (document.querySelector('script[src*="razorpay"]')) {
      const checkReady = setInterval(() => {
        if ((window as any).Razorpay) {
          setLoaded(true);
          clearInterval(checkReady);
        }
      }, 100);
      return () => clearInterval(checkReady);
    }

    // Load the script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error("Failed to load Razorpay");
    document.body.appendChild(script);
  }, []);

  return loaded;
}
