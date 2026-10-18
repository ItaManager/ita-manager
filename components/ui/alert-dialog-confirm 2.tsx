"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertDialogConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  titre: string;
  description: string;
  labelConfirm?: string;
  labelCancel?: string;
  variant?: "default" | "destructive";
}

export function AlertDialogConfirm({
  open,
  onOpenChange,
  onConfirm,
  titre,
  description,
  labelConfirm = "Confirmer",
  labelCancel = "Annuler",
  variant = "default",
}: AlertDialogConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">
            {labelCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "rounded-full bg-red-600 hover:bg-red-700"
                : "rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            }
          >
            {labelConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
