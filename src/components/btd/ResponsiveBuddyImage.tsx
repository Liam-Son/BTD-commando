import type { ImgHTMLAttributes } from "react";

type ResponsiveBuddyImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "sizes"
> & {
  src: string;
  sizes: string;
};

const widths = [48, 96, 192] as const;

export function ResponsiveBuddyImage({ src, sizes, alt, ...props }: ResponsiveBuddyImageProps) {
  const base = src.replace(/\.png$/, "");
  const srcSet = (extension: string) =>
    widths.map((width) => `${base}-${width}.${extension} ${width}w`).join(", ");

  return (
    <picture>
      <source srcSet={srcSet("avif")} sizes={sizes} type="image/avif" />
      <source srcSet={srcSet("webp")} sizes={sizes} type="image/webp" />
      <img
        {...props}
        src={src}
        srcSet={srcSet("png")}
        sizes={sizes}
        alt={alt}
        width={1920}
        height={1920}
      />
    </picture>
  );
}
