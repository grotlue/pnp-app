"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ButtonGroup } from "@/components/ui/button-group";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
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
        <Dialog.Backdrop
          data-slot="modal-backdrop"
          className="fixed inset-0 z-50 bg-black/50"
        />
        <Dialog.Viewport
          data-slot="modal-viewport"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <Dialog.Popup
            data-slot="modal-popup"
            className="border-border bg-background pointer-events-auto w-full max-w-2xl rounded-xl border p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Close
                nativeButton
                className="border-input bg-background hover:bg-accent inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm leading-none"
              >
                ×
              </Dialog.Close>
            </div>
            <div className="space-y-4">{children}</div>
            {footer ? (
              <div className="mt-4">
                <ButtonGroup>{footer}</ButtonGroup>
              </div>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
