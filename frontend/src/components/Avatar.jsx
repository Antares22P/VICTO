import { useMemo } from "react";

const avatarEmojis = [
  "🦊",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐸",
  "🐵",
  "🐙",
  "🦄",
  "🐝",
  "🦋",
  "🌻",
  "🌈",
  "⭐",
  "🚀",
  "🌙",
  "🔥",
  "⚡",
  "🎯",
  "🎨",
];

const avatarColors = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

function getHash(value = "") {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

function getAvatarEmoji(name = "") {
  const hash = getHash(name);

  return avatarEmojis[hash % avatarEmojis.length];
}

function getAvatarColor(name = "") {
  const hash = getHash(name);

  return avatarColors[hash % avatarColors.length];
}

function Avatar({ name, image, size = 40 }) {
  const emoji = useMemo(() => getAvatarEmoji(name), [name]);

  const color = useMemo(() => getAvatarColor(name), [name]);

  // Custom uploaded profile image
  if (image) {
    return (
      <img
        src={image}
        alt={name || "User"}
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      />
    );
  }

  // Automatic emoji avatar
  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        background: color,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        fontSize: size * 0.48,

        userSelect: "none",

        border: "2px solid rgba(255,255,255,0.15)",

        boxSizing: "border-box",
      }}
    >
      {emoji}
    </div>
  );
}

export default Avatar;