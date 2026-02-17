"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_UPLOAD_SIZE_BYTES } from "@/lib/storage/image-upload";
import { cn } from "@/lib/utils/cn";

const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

type ImageDimensions = {
  width: number;
  height: number;
};

type ImageUploadFieldProps = {
  value: string;
  label: string;
  previewAlt: string;
  hint: string;
  emptyLabel: string;
  uploadLabel: string;
  replaceLabel: string;
  removeLabel: string;
  uploadingLabel: string;
  invalidTypeLabel: string;
  invalidDimensionsLabel: string;
  invalidFileSizeLabel: string;
  maxFileSizeBytes?: number;
  disabled?: boolean;
  className?: string;
  onChange: (nextPath: string) => void;
  onUpload: (
    file: File,
    dimensions: ImageDimensions,
  ) => Promise<{ path: string }>;
  onResolvePreviewUrl: (path: string) => Promise<string>;
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

async function readImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  return new Promise<ImageDimensions>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("Failed to load image dimensions"));
    image.src = dataUrl;
  });
}

export function ImageUploadField({
  value,
  label,
  previewAlt,
  hint,
  emptyLabel,
  uploadLabel,
  replaceLabel,
  removeLabel,
  uploadingLabel,
  invalidTypeLabel,
  invalidDimensionsLabel,
  invalidFileSizeLabel,
  maxFileSizeBytes = MAX_IMAGE_UPLOAD_SIZE_BYTES,
  disabled,
  className,
  onChange,
  onUpload,
  onResolvePreviewUrl,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolvedPath, setResolvedPath] = useState("");
  const [fieldMessage, setFieldMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!value) {
      setPreviewUrl(null);
      setResolvedPath("");
      return () => {
        cancelled = true;
      };
    }

    if (resolvedPath === value) {
      return () => {
        cancelled = true;
      };
    }

    setFieldMessage("");
    void onResolvePreviewUrl(value)
      .then((url) => {
        if (cancelled) {
          return;
        }
        setPreviewUrl(url);
        setResolvedPath(value);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setFieldMessage(
          error instanceof Error ? error.message : "Request failed",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [onResolvePreviewUrl, resolvedPath, value]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
      setFieldMessage(invalidTypeLabel);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setFieldMessage(invalidFileSizeLabel);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    setFieldMessage("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const dimensions = await readImageDimensions(dataUrl);
      if (dimensions.width !== dimensions.height) {
        throw new Error(invalidDimensionsLabel);
      }

      const uploadResponse = await onUpload(file, dimensions);
      onChange(uploadResponse.path);
      setPreviewUrl(dataUrl);
      setResolvedPath(uploadResponse.path);
      setFieldMessage("");
    } catch (error) {
      setFieldMessage(
        error instanceof Error ? error.message : "Request failed",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsUploading(false);
    }
  }

  function removeImage() {
    onChange("");
    setPreviewUrl(null);
    setResolvedPath("");
    setFieldMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={inputId} className="text-muted-foreground text-xs">
        {label}
      </label>
      <div className="grid gap-3 md:grid-cols-[200px_1fr]">
        <div className="border-border bg-muted/30 overflow-hidden rounded-lg border">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={previewAlt}
              width={200}
              height={200}
              className="h-[200px] w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="text-muted-foreground flex h-[200px] items-center justify-center px-3 text-center text-xs">
              {emptyLabel}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_EXTENSIONS}
            className="hidden"
            disabled={disabled || isUploading}
            onChange={handleFileChange}
          />
          <div className="text-muted-foreground text-xs">{hint}</div>
          {value ? (
            <div className="border-border bg-background rounded-md border px-2 py-1 font-mono text-xs break-all">
              {value}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {value ? replaceLabel : uploadLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading || !value}
              onClick={removeImage}
            >
              {removeLabel}
            </Button>
          </div>
          {isUploading ? (
            <div className="text-muted-foreground text-xs">
              {uploadingLabel}
            </div>
          ) : null}
          {fieldMessage ? (
            <div className="border-border bg-background rounded-md border p-2 text-xs">
              {fieldMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
