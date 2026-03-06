"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Ably from "ably";
import Room from "@/components/Room";
import Nuigurumi, { NUIGURUMI_TYPES, DEFAULT_FACES_RIGHT, type NuigurumiType } from "@/components/Nuigurumi";

interface UserInfo {
  id: string;
  type: NuigurumiType;
  posX: number;
}

// 常駐NPCぬいぐるみ（誰もいなくても1体いる）
const NPC: UserInfo = {
  id: "npc",
  type: "usagi",
  posX: 30,
};

export default function Home() {
  const [myType, setMyType] = useState<NuigurumiType>("usagi");
  const [myId, setMyId] = useState("");
  const [others, setOthers] = useState<Map<string, UserInfo>>(new Map());
  const [seconds, setSeconds] = useState(0);
  const [slidingId, setSlidingId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [fireDone, setFireDone] = useState(false);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const appearedIdsRef = useRef<Set<string>>(new Set());

  // セッションID生成
  useEffect(() => {
    const id = crypto.randomUUID().slice(0, 8);
    const type = NUIGURUMI_TYPES[Math.floor(Math.random() * NUIGURUMI_TYPES.length)];
    setMyId(id);
    setMyType(type);
  }, []);

  // 滞在時間カウンター
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ably接続
  useEffect(() => {
    if (!myId) return;

    const ably = new Ably.Realtime({
      authUrl: `/api/ably?clientId=${myId}`,
      clientId: myId,
    });
    ablyRef.current = ably;

    const channel = ably.channels.get("nuismo-room");
    channelRef.current = channel;

    ably.connection.on("connected", () => {
      setConnected(true);
      channel.presence.enter({ type: myType });
    });

    channel.presence.subscribe("enter", (msg) => {
      if (msg.clientId === myId) return;
      setOthers((prev) => {
        const next = new Map(prev);
        next.set(msg.clientId, {
          id: msg.clientId,
          type: (msg.data?.type as NuigurumiType) || "kuma",
          posX: Math.random() * 70 + 15,
        });
        return next;
      });
    });

    channel.presence.subscribe("leave", (msg) => {
      setOthers((prev) => {
        const next = new Map(prev);
        next.delete(msg.clientId);
        return next;
      });
    });

    channel.subscribe("fire-request", (msg) => {
      if (msg.data?.targetId === myId) {
        setSlidingId(msg.data.fromId);
        setTimeout(() => setSlidingId(null), 3000);
      }
    });

    channel.presence.get().then((members) => {
      const map = new Map<string, UserInfo>();
      members.forEach((m) => {
        if (m.clientId !== myId) {
          map.set(m.clientId, {
            id: m.clientId,
            type: (m.data?.type as NuigurumiType) || "kuma",
            posX: Math.random() * 70 + 15,
          });
        }
      });
      setOthers(map);
    });

    return () => {
      channel.presence.leave();
      ably.close();
    };
  }, [myId, myType]);

  // 火を借りる（1回だけ）
  const handleFireRequest = useCallback(() => {
    if (fireDone) return;
    const targetIds = [...Array.from(others.keys()), "npc"];
    if (targetIds.length === 0) return;
    const targetId = targetIds[Math.floor(Math.random() * targetIds.length)];
    if (channelRef.current && targetId !== "npc") {
      channelRef.current.publish("fire-request", {
        fromId: myId,
        targetId,
      });
    }
    setSlidingId(targetId);
    setTimeout(() => setSlidingId(null), 3000);
    setFireDone(true);
  }, [others, myId, fireDone]);

  // NPC + 他ユーザーを統合（NPCは自分と同じタイプなら別タイプに変更）
  const npcType: NuigurumiType = myType === "usagi" ? "kaeru" : "usagi";
  const allOthers = new Map(others);
  allOthers.set("npc", { ...NPC, type: npcType });

  // 向き判定ヘルパー：相手の方を向くためにflipが必要か
  // デフォルト右向きのキャラが左を向く必要がある → flip
  // デフォルト左向きのキャラが右を向く必要がある → flip
  const selfPosX = 62;
  const needsFlip = (type: NuigurumiType, myPosX: number, targetPosX: number) => {
    const shouldFaceRight = targetPosX > myPosX;
    const facesRight = DEFAULT_FACES_RIGHT[type];
    return facesRight !== shouldFaceRight;
  };

  const shouldFlipSelf = (() => {
    const positions = Array.from(allOthers.values()).map((u) => u.posX);
    if (positions.length === 0) return false;
    const closest = positions.reduce((a, b) =>
      Math.abs(a - selfPosX) < Math.abs(b - selfPosX) ? a : b
    );
    return needsFlip(myType, selfPosX, closest);
  })();

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <Room>
      {/* タイトル */}
      <div
        className="absolute top-5 left-5 select-none z-10"
        style={{
          color: "#FFF4ED",
          textShadow: "0 1px 6px rgba(0,0,0,0.4)",
          fontFamily: "var(--font-crimson-pro), serif",
          fontSize: "18px",
          letterSpacing: "0.15em",
          lineHeight: "18px",
        }}
      >
        nuismo
      </div>

      {/* 滞在時間（右下） */}
      <div
        className="absolute bottom-5 right-5 select-none z-10"
        style={{
          color: "rgba(255,244,237,0.5)",
          fontSize: "13px",
          fontFamily: "var(--font-crimson-pro), serif",
          letterSpacing: "0.05em",
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {minutes}:{secs.toString().padStart(2, "0")}
      </div>

      {/* 他ユーザー + NPCのぬいぐるみ */}
      {Array.from(allOthers.values()).map((user) => {
        const isNew = !appearedIdsRef.current.has(user.id);
        if (isNew) appearedIdsRef.current.add(user.id);
        const isSliding = slidingId === user.id;

        return (
          <div
            key={user.id}
            className="absolute"
            style={{
              bottom: "38%",
              left: `${user.posX}%`,
              transform: "translateX(-50%)",
              animation: isSliding
                ? undefined
                : isNew
                  ? "fade-in 1s ease-out"
                  : undefined,
            }}
          >
            <Nuigurumi
              type={user.type}
              sliding={isSliding}
              slideDirection={user.posX > selfPosX ? -35 : 35}
              flipX={needsFlip(user.type, user.posX, selfPosX)}
              isNew={isNew}
              smokeDelay={user.id === "npc" ? 2.5 : (user.posX % 3)}
            />
          </div>
        );
      })}

      {/* 自分のぬいぐるみ（他ユーザーと同じ水平線） */}
      <div
        className="absolute z-10"
        style={{
          bottom: "38%",
          left: "62%",
          transform: "translateX(-50%)",
        }}
      >
        <Nuigurumi type={myType} isSelf flipX={shouldFlipSelf} isNew showSmoke={fireDone} />
      </div>

      {/* 自分ラベル + 火を借りるボタン */}
      <div
        className="absolute flex flex-col items-center z-10"
        style={{
          bottom: "30%",
          left: "62%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          className="text-center select-none"
          style={{
            color: "#F5E6C8",
            fontSize: "10px",
            fontFamily: "var(--font-crimson-pro), serif",
            letterSpacing: "0.1em",
            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          you
        </div>

        {!fireDone && (
          <button
            onClick={handleFireRequest}
            className="mt-3 px-5 py-2 rounded-full text-xs transition-opacity duration-300 cursor-pointer select-none backdrop-blur-sm"
            style={{
              background: "rgba(23,23,23,0.6)",
              color: "#FFF4ED",
              border: "1px dashed rgba(255,194,155,0.4)",
              fontFamily: "var(--font-crimson-pro), serif",
              letterSpacing: "0.1em",
              opacity: 0.8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
          >
            火を借りる
          </button>
        )}
      </div>
    </Room>
  );
}
