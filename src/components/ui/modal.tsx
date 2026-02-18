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
        <Dialog.Backdrop data-slot="modal-backdrop" />
        <Dialog.Viewport data-slot="modal-viewport">
          <Dialog.Popup data-slot="modal-popup">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Close nativeButton>×</Dialog.Close>
            </div>
            <div>{children}</div>
            {footer ? (
              <div>
                <ButtonGroup>{footer}</ButtonGroup>
              </div>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
