"use client";

export default function Room({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#1a1a1a" }}
    >
      {/* 背景写真 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/assets/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* 少し暗くするオーバーレイ */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* コンテンツ */}
      {children}
    </div>
  );
}
