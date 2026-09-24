import Image from "next/image";

/** Logo untuk struk — grayscale agar rapi saat dicetak thermal. */
export function ReceiptLogo({ size = 56 }: { size?: number }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Logo"
      width={size}
      height={size}
      className="rounded-full grayscale"
      style={{ width: size, height: size }}
    />
  );
}
