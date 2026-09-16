"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CoinsIcon, GiftIcon, PercentIcon } from "lucide-react";
import { toast } from "sonner";

interface BillingControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingControlsModal({ isOpen, onClose }: BillingControlsModalProps) {
  const [tenantId, setTenantId] = useState("tenant_01");
  const [credits, setCredits] = useState(10000);
  const [discountPercent, setDiscountPercent] = useState(20);

  const handleGrantCredits = () => {
    toast.success(`Granted ${credits.toLocaleString()} promotional execution credits to ${tenantId}`);
    onClose();
  };

  const handleApplyDiscount = () => {
    toast.success(`Applied ${discountPercent}% custom discount to ${tenantId}'s next renewal invoice`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border border-[#1E222B] bg-[#0E1015] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <CoinsIcon className="size-4 text-amber-400" />
            <span>Promotional Billing Controls</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#94A3B8]">
            Grant promotional execution credits or issue custom discounts to workspaces.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div>
            <label className="text-[11px] text-[#94A3B8]">Select Target Tenant:</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#1E222B] bg-[#14161B] p-2 text-xs text-white focus:outline-none"
            >
              <option value="tenant_01">Acme Global Industries (Enterprise)</option>
              <option value="tenant_02">NovaCare Health Systems (Team)</option>
              <option value="tenant_03">GrowthEx Digital Labs (Free)</option>
            </select>
          </div>

          <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-3 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <GiftIcon className="size-3.5 text-emerald-400" />
              <span>Grant Execution Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1E222B] bg-[#090A0C] p-2 font-mono text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGrantCredits}
                className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500"
              >
                Grant
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-3 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <PercentIcon className="size-3.5 text-sky-400" />
              <span>Apply Custom Renewal Discount</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1E222B] bg-[#090A0C] p-2 font-mono text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="rounded-lg bg-sky-600 px-3 py-2 font-medium text-white hover:bg-sky-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
