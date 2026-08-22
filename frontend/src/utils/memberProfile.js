import { ref, update } from "firebase/database";
import { database } from "../firebase";

export async function saveProfileImage(roomId, memberId, profileImage) {
  if (!roomId || !memberId) {
    throw new Error("Room or member ID missing");
  }

  const memberRef = ref(
    database,
    `rooms/${roomId}/members/${memberId}`,
  );

  await update(memberRef, {
    profileImage: profileImage || null,
  });
}