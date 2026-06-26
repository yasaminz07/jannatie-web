import {
  collection, addDoc, query, where, getDocs,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface ReminderPayload {
  fromUid: string;
  fromName: string;
  fromUsername: string;
  toUid: string;
  type: "prayer" | "adhkar" | "habit" | "hifz";
  label: string;
}

export async function sendReminder(payload: ReminderPayload): Promise<void> {
  const todayStr = new Date().toISOString().split("T")[0];

  // Rate-limit: one reminder per label per day
  const existing = await getDocs(
    query(
      collection(db, "notifications", payload.toUid, "items"),
      where("fromUid", "==", payload.fromUid),
      where("label", "==", payload.label),
    )
  );

  const alreadySentToday = existing.docs.some(d => {
    const ts = d.data().sentAt as Timestamp | undefined;
    if (!ts) return false;
    return ts.toDate().toISOString().split("T")[0] === todayStr;
  });

  if (alreadySentToday) return;

  await addDoc(collection(db, "notifications", payload.toUid, "items"), {
    fromUid: payload.fromUid,
    fromName: payload.fromName,
    fromUsername: payload.fromUsername,
    type: payload.type,
    label: payload.label,
    sentAt: serverTimestamp(),
    read: false,
  });
}
