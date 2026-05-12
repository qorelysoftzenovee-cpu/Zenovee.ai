// full/path/to/app/dashboard/billing/components/PricingTable.tsx
"use client";

import React, { useState } from 'react';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { subscriptionPlans } from '@/lib/subscription-plans';
import { createRazorpaySubscriptionAction } from '../actions'; // We'll create this action

interface PricingTableProps {
  currentPlanId?: string | null;
  userId: string;
}

export default function PricingTable({ currentPlanId, userId }: PricingTableProps) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoadingPlanId(planId);
    setError(null);
    try {
      const result = await createRazorpaySubscriptionAction(userId, planId);
      if (result.error) {
        setError(result.error);
      } else if (result.order) {
        // Integrate Razorpay Checkout
        const options = {
          key: result.order.key_id,
          subscription_id: result.order.orderId, // Use subscription_id for subscriptions
          name: "Zenovee AI",
          description: result.order.description,
          image: "/zenovee-logo.png", // Your logo
          handler: function (response: any) {
            // Handle successful payment, verify on backend if needed
            console.log("Razorpay success:", response);
            alert("Subscription successful! Credits will be added shortly.");
            // Redirect or revalidate data
            window.location.reload(); 
          },
          prefill: {
            name: "User Name", // Replace with actual user name
            email: "user@example.com", // Replace with actual user email
          },
          notes: {
            userId: userId,
            planId: planId,
          },
          theme: {
            color: "#3B82F6",
          },
        };
        // Ensure Razorpay script is loaded
        if (typeof window.Razorpay === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const rzp = new window.Razorpay(options);
            rzp.open();
          };
          document.body.appendChild(script);
        } else {
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {subscriptionPlans.map((plan) => (
        <div
          key={plan.id}
          className={`bg-white p-8 rounded-2xl border ${
            currentPlanId === plan.id ? 'border-blue-500 shadow-lg' : 'border-slate-200 shadow-sm'
          } flex flex-col`}
        >
          {currentPlanId === plan.id && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Current Plan
            </div>
          )}
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
          <p className="text-slate-500 mb-6">{plan.credits} credits/month</p>
          <p className="text-4xl font-bold text-slate-900 mb-1">
            ${plan.price}
            <span className="text-lg font-normal text-slate-500">/month</span>
          </p>
          <ul className="space-y-3 flex-1 my-8">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-slate-700">
                <Check size={18} className="text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
          {error && loadingPlanId === plan.id && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <button
            onClick={() => handleUpgrade(plan.id)}
            disabled={loadingPlanId === plan.id || currentPlanId === plan.id}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              currentPlanId === plan.id
                ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            }`}
          >
            {loadingPlanId === plan.id ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Processing...
              </>
            ) : currentPlanId === plan.id ? (
              'Current Plan'
            ) : (
              'Upgrade'
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}