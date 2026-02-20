"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form-controls";
import { UiDiv } from "@/components/ui/html-elements";
import { Input } from "@/components/ui/input";
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

const readFileAsDataUrl = async (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
};

const readImageDimensions = async (
  dataUrl: string,
): Promise<ImageDimensions> => {
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
};

const ImageUploadField = ({
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
}: ImageUploadFieldProps) => {
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleRemoveImage = () => {
    onChange("");
    setPreviewUrl(null);
    setResolvedPath("");
    setFieldMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <UiDiv className={cn("space-y-2", className)}>
      <FormLabel htmlFor={inputId} className="text-muted-foreground text-xs">
        {label}
      </FormLabel>
      <UiDiv className="grid gap-3 md:grid-cols-[200px_1fr]">
        <UiDiv className="border-border bg-muted/30 w-full max-w-[200px] overflow-hidden rounded-lg border">
          <AspectRatio ratio={1}>
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={previewAlt}
                fill
                sizes="200px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <UiDiv className="text-muted-foreground flex h-full items-center justify-center px-3 text-center text-xs">
                {emptyLabel}
              </UiDiv>
            )}
          </AspectRatio>
        </UiDiv>
        <UiDiv className="space-y-2">
          <Input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_EXTENSIONS}
            className="hidden"
            disabled={disabled || isUploading}
            onChange={handleFileChange}
          />
          <UiDiv className="text-muted-foreground text-xs">{hint}</UiDiv>
          {value ? (
            <UiDiv className="border-border bg-background rounded-md border px-2 py-1 font-mono text-xs break-all">
              {value}
            </UiDiv>
          ) : null}
          <UiDiv className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              onClick={handleOpenFilePicker}
            >
              {value ? replaceLabel : uploadLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading || !value}
              onClick={handleRemoveImage}
            >
              {removeLabel}
            </Button>
          </UiDiv>
          {isUploading ? (
            <UiDiv className="text-muted-foreground text-xs">
              {uploadingLabel}
            </UiDiv>
          ) : null}
          {fieldMessage ? (
            <UiDiv className="border-border bg-background rounded-md border p-2 text-xs">
              {fieldMessage}
            </UiDiv>
          ) : null}
        </UiDiv>
      </UiDiv>
    </UiDiv>
  );
};

export default ImageUploadField;
