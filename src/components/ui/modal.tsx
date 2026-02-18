"use client";

import { Dialog } from "@base-ui/react/dialog";
import { buttonVariants } from "@/components/ui/button";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="border-border bg-background w-full max-w-2xl rounded-xl border p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Close
                className={buttonVariants({ variant: "outline", size: "sm" })}
                nativeButton
              >
                ×
              </Dialog.Close>
            </div>
            <div className="space-y-4">{children}</div>
            {footer ? (
              <div className="mt-4 flex flex-wrap gap-2">{footer}</div>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
