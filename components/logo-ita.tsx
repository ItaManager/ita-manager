import Image from "next/image";

export function LogoITA({ className }: { className?: string }) {
  return (
    <Image
      src="/image.png"
      alt="ITA SARL - Ingénierie & Travaux AKOUTROU"
      width={150}
      height={100}
      className={className}
      style={{ width: "150px", height: "auto" }}
      priority
    />
  );
}
