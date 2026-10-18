"use client";

import { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface TooltipProviderClientProps {
  children: ReactNode;
}

export function TooltipProviderClient({ children }: TooltipProviderClientProps) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
