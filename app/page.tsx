"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Ably from "ably";
import Room from "@/components/Room";
import Nuigurumi, { NUIGURUMI_TYPES, type NuigurumiType } from "@/components/Nuigurumi";

interface UserInfo {
  id: string;
  type: NuigurumiType;
  posX: number;
}

const TIMER_OPTIONS = [3, 5, 10, 15]; // 分

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
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  // タイマー
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null); // 秒
  const [timerPickerOpen, setTimerPickerOpen] = useState(false);
  const [timerDone, setTimerDone] = useState(false);

  // セッションID生成
  useEffect(() => {
    const id = crypto.randomUUID().slice(0, 8);
    const type = NUIGURUMI_TYPES[Math.floor(Math.random() * NUIGURUMI_TYPES.length)];
    setMyId(id);
    setMyType(type);
  }, []);

  // 滞在時間カウンター + タイマーカウントダウン
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
      setTimerRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // タイマー終了
          setTimerDone(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      });
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

  // 火を借りる（NPC含む全員が対象）
  const handleFireRequest = useCallback(() => {
    // allOthersはrenderごとに再計算されるので、othersとNPCから直接取得
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
  }, [others, myId]);

  // タイマーセット
  const handleSetTimer = (min: number) => {
    setTimerRemaining(min * 60);
    setTimerPickerOpen(false);
    setTimerDone(false);
  };

  const handleCancelTimer = () => {
    setTimerRemaining(null);
    setTimerPickerOpen(false);
    setTimerDone(false);
  };

  // NPC + 他ユーザーを統合（NPCは自分と同じタイプなら別タイプに変更）
  const npcType: NuigurumiType = myType === "usagi" ? "kaeru" : "usagi";
  const allOthers = new Map(others);
  allOthers.set("npc", { ...NPC, type: npcType });

  // 自分が向く方向
  const shouldFlipSelf = (() => {
    const positions = Array.from(allOthers.values()).map((u) => u.posX);
    const closest = positions.reduce((a, b) =>
      Math.abs(a - 50) < Math.abs(b - 50) ? a : b
    );
    return closest > 50;
  })();

  const totalUsers = allOthers.size + (connected ? 1 : 0);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // タイマー表示
  const timerMin = timerRemaining !== null ? Math.floor(timerRemaining / 60) : 0;
  const timerSec = timerRemaining !== null ? timerRemaining % 60 : 0;

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

      {/* 同時接続数 */}
      <div
        className="absolute top-5 right-5 select-none z-10"
        style={{ color: "#FFC29B", fontSize: "16px", fontFamily: "var(--font-crimson-pro), serif", letterSpacing: "0.15em", lineHeight: "18px", paddingTop: "2px", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
      >
        {totalUsers}<span style={{ fontSize: "13px" }}>人</span>
      </div>

      {/* 滞在時間（左下） */}
      <div
        className="absolute bottom-5 left-5 select-none z-10"
        style={{ color: "rgba(255,244,237,0.5)", fontSize: "10px", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
      >
        {minutes}:{secs.toString().padStart(2, "0")}
      </div>

      {/* 休憩タイマー（右下） */}
      <div className="absolute bottom-5 right-5 select-none z-20">
        {timerDone ? (
          /* タイマー終了 */
          <button
            onClick={handleCancelTimer}
            className="px-3 py-1.5 rounded-full backdrop-blur-sm cursor-pointer"
            style={{
              background: "rgba(255,194,155,0.25)",
              color: "#FFC29B",
              border: "1px solid rgba(255,194,155,0.5)",
              fontSize: "11px",
              fontFamily: "var(--font-crimson-pro), serif",
              animation: "timer-blink 1s ease-in-out infinite",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            もどろ
          </button>
        ) : timerRemaining !== null ? (
          /* カウントダウン中 */
          <button
            onClick={handleCancelTimer}
            className="px-3 py-1.5 rounded-full backdrop-blur-sm cursor-pointer"
            style={{
              background: "rgba(23,23,23,0.5)",
              color: "#FFC29B",
              border: "1px dashed rgba(255,194,155,0.3)",
              fontSize: "11px",
              fontFamily: "var(--font-crimson-pro), serif",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {timerMin}:{timerSec.toString().padStart(2, "0")}
          </button>
        ) : timerPickerOpen ? (
          /* タイマー選択 */
          <div
            className="flex gap-2 items-center rounded-full px-2 py-1 backdrop-blur-sm"
            style={{ background: "rgba(23,23,23,0.6)", border: "1px dashed rgba(255,194,155,0.3)" }}
          >
            {TIMER_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => handleSetTimer(m)}
                className="px-2 py-1 rounded-full cursor-pointer transition-colors"
                style={{
                  color: "#FFC29B",
                  fontSize: "11px",
                  fontFamily: "var(--font-crimson-pro), serif",
                  background: "transparent",
                  border: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,194,155,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {m}m
              </button>
            ))}
            <button
              onClick={() => setTimerPickerOpen(false)}
              className="px-1 cursor-pointer"
              style={{ color: "rgba(255,244,237,0.4)", fontSize: "11px", background: "transparent", border: "none" }}
            >
              ×
            </button>
          </div>
        ) : (
          /* タイマーボタン（デフォルト） */
          <button
            onClick={() => setTimerPickerOpen(true)}
            className="px-3 py-1.5 rounded-full backdrop-blur-sm cursor-pointer"
            style={{
              background: "rgba(23,23,23,0.4)",
              color: "rgba(255,244,237,0.5)",
              border: "1px dashed rgba(255,194,155,0.2)",
              fontSize: "10px",
              fontFamily: "var(--font-crimson-pro), serif",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            timer
          </button>
        )}
      </div>

      {/* 他ユーザー + NPCのぬいぐるみ */}
      {Array.from(allOthers.values()).map((user) => (
        <div
          key={user.id}
          className="absolute"
          style={{
            bottom: "38%",
            left: `${user.posX}%`,
            transform: "translateX(-50%)",
            animation: slidingId === user.id
              ? undefined
              : "fade-in 1s ease-out",
          }}
        >
          <Nuigurumi
            type={user.type}
            sliding={slidingId === user.id}
            slideDirection={user.posX > 50 ? -40 : 40}
            flipX={user.posX > 50}
          />
        </div>
      ))}

      {/* 自分のぬいぐるみ（他ユーザーと同じ水平線） */}
      <div
        className="absolute z-10"
        style={{
          bottom: "38%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Nuigurumi type={myType} isSelf flipX={shouldFlipSelf} />
      </div>

      {/* 自分ラベル + 火を借りるボタン */}
      <div
        className="absolute flex flex-col items-center z-10"
        style={{
          bottom: "25%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          className="text-center select-none"
          style={{
            color: "#FFC29B",
            fontSize: "10px",
            fontFamily: "var(--font-crimson-pro), serif",
            letterSpacing: "0.1em",
            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          you
        </div>

        <button
          onClick={handleFireRequest}
          disabled={false}
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
      </div>
    </Room>
  );
}
