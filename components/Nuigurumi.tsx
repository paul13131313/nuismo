"use client";

import Image from "next/image";
import Smoke from "./Smoke";

export type NuigurumiType = "usagi" | "kuma" | "kaeru" | "neko" | "medusa";

const NUIGURUMI_IMAGES: Record<NuigurumiType, string> = {
  usagi: "/assets/chara1.png",
  kuma: "/assets/chara2.png",
  kaeru: "/assets/chara3.png",
  neko: "/assets/chara4.png",
  medusa: "/assets/chara5.png",
};

const NUIGURUMI_LABELS: Record<NuigurumiType, string> = {
  usagi: "うさぎ",
  kuma: "くま",
  kaeru: "かえる",
  neko: "ねこ",
  medusa: "メデューサ",
};

interface NuigurumiProps {
  type: NuigurumiType;
  isSelf?: boolean;
  sliding?: boolean;
  slideDirection?: number;
  flipX?: boolean;
}

export default function Nuigurumi({ type, isSelf, sliding, slideDirection, flipX }: NuigurumiProps) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        animation: sliding
          ? "slide-closer 3s ease-in-out forwards"
          : "fade-in 1s ease-out forwards",
        ["--slide-x" as string]: `${slideDirection || 0}px`,
      }}
    >
      <Smoke />
      <div
        className={isSelf ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"}
        style={{
          transform: flipX ? "scaleX(-1)" : undefined,
          animation: isSelf ? "idle-sway 6s ease-in-out infinite" : "idle-sway-2 7s ease-in-out infinite",
        }}
      >
        <Image
          src={NUIGURUMI_IMAGES[type]}
          alt={NUIGURUMI_LABELS[type]}
          width={120}
          height={180}
          style={{ objectFit: "contain", height: "auto", maxHeight: "180px" }}
          priority={isSelf}
        />
      </div>
    </div>
  );
}

export const NUIGURUMI_TYPES: NuigurumiType[] = ["usagi", "kuma", "kaeru", "neko", "medusa"];
