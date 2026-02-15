"use client";

import { Button } from "@/components/ui/button";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer ? <div className="mt-4 flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
