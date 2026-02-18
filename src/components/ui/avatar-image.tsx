import Image, { type ImageProps } from "next/image";

type AvatarImageProps = Omit<
  ImageProps,
  "width" | "height" | "className" | "alt"
> & {
  alt: string;
};

export function AvatarImage(props: AvatarImageProps) {
  const { alt, ...restProps } = props;

  return (
    <Image
      {...restProps}
      alt={alt}
      width={200}
      height={200}
      className="h-[200px] w-full object-cover"
    />
  );
}
