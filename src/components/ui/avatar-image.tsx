import Image, { type ImageProps } from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type AvatarImageProps = Omit<
  ImageProps,
  "width" | "height" | "className" | "alt" | "fill" | "sizes"
> & {
  alt: string;
};

export function AvatarImage(props: AvatarImageProps) {
  const { alt, ...restProps } = props;

  return (
    <AspectRatio ratio={1}>
      <Image {...restProps} alt={alt} fill sizes="200px" />
    </AspectRatio>
  );
}
