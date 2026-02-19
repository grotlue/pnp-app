"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type FeedbackMessageProps = {
  message?: string;
  className?: string;
};

const successPattern =
  /\b(saved|created|deleted|sent|enabled|updated|success|verified)\b/i;
const errorPattern =
  /\b(error|failed|invalid|required|denied|forbidden|missing|not found)\b/i;

export function FeedbackMessage({ message, className }: FeedbackMessageProps) {
  const previousMessageRef = useRef<string>("");

  useEffect(() => {
    if (!message || message === previousMessageRef.current) {
      return;
    }

    previousMessageRef.current = message;

    if (errorPattern.test(message)) {
      toast.error(message);
      return;
    }

    if (successPattern.test(message)) {
      toast.success(message);
      return;
    }

    toast.info(message);
  }, [message]);

  if (!message) {
    return null;
  }

  return <div className={className}>{message}</div>;
}
