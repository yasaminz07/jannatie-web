import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, serverTimestamp, arrayUnion, arrayRemove, deleteField,
  type UpdateData,
} from "firebase/firestore";
import { db } from "./firebase";

export interface CommunityEvent {
  id: string;
  communityUid: string;
  communityName: string;
  communityUsername: string;
  communityPhotoURL: string | null;
  title: string;
  description: string;
  photoURL: string | null;
  photoAspectRatio?: string | null; // "1:1" | "4:5" | "3:4" | "9:16"
  date: string; // YYYY-MM-DD
  time?: string;
  venueName?: string;
  address: string;
  city: string;
  externalLink?: string;
  pinnedCommentId?: string;
  createdAt: unknown;
}

export interface CommentLiker {
  uid: string;
  name: string;
  photoURL: string | null;
  isCommunity: boolean;
}

export interface EventComment {
  id: string;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string | null;
  authorIsCommunity?: boolean;
  text: string;
  parentId?: string;
  likedBy?: Record<string, CommentLiker>;
  createdAt: unknown;
}

export async function createEvent(data: Omit<CommunityEvent, "id" | "createdAt">) {
  return addDoc(collection(db, "communityEvents"), { ...data, createdAt: serverTimestamp() });
}

export async function updateEvent(eventId: string, data: UpdateData<Omit<CommunityEvent, "id" | "communityUid" | "createdAt">>) {
  await updateDoc(doc(db, "communityEvents", eventId), data);
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, "communityEvents", eventId));
}

export async function toggleEventLike(eventId: string, uid: string, currentlyLiked: boolean) {
  const ref = doc(db, "communityEvents", eventId, "likes", uid);
  if (currentlyLiked) {
    await deleteDoc(ref);
  } else {
    const { setDoc, serverTimestamp: ts } = await import("firebase/firestore");
    await setDoc(ref, { uid, likedAt: ts() });
  }
}

export async function addEventComment(eventId: string, comment: Omit<EventComment, "id" | "createdAt">) {
  return addDoc(collection(db, "communityEvents", eventId, "comments"), {
    ...comment,
    createdAt: serverTimestamp(),
  });
}

export async function deleteEventComment(eventId: string, commentId: string) {
  await deleteDoc(doc(db, "communityEvents", eventId, "comments", commentId));
}

export async function toggleCommentLike(eventId: string, commentId: string, liker: CommentLiker, currentlyLiked: boolean) {
  await updateDoc(doc(db, "communityEvents", eventId, "comments", commentId), {
    [`likedBy.${liker.uid}`]: currentlyLiked ? deleteField() : liker,
  });
}

export async function pinComment(eventId: string, commentId: string) {
  await updateDoc(doc(db, "communityEvents", eventId), { pinnedCommentId: commentId });
}

export async function unpinComment(eventId: string) {
  await updateDoc(doc(db, "communityEvents", eventId), { pinnedCommentId: deleteField() });
}

export async function reportComment(params: {
  eventId: string;
  eventTitle: string;
  commentId: string;
  commentText: string;
  reporterUid: string;
  reporterName: string;
  reporterType: "user" | "community";
  targetAuthorUid: string;
  targetAuthorName: string;
  reason: string;
}) {
  return addDoc(collection(db, "reports"), {
    ...params,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function followCommunity(myUid: string, communityUid: string) {
  await updateDoc(doc(db, "users", myUid), { following: arrayUnion(communityUid) });
}

export async function unfollowCommunity(myUid: string, communityUid: string) {
  await updateDoc(doc(db, "users", myUid), { following: arrayRemove(communityUid) });
}

export async function getFollowerCount(communityUid: string): Promise<number> {
  const { getCountFromServer } = await import("firebase/firestore");
  const snap = await getCountFromServer(query(collection(db, "users"), where("following", "array-contains", communityUid)));
  return snap.data().count;
}

export async function isFollowingCommunity(myUid: string, communityUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", myUid));
  if (!snap.exists()) return false;
  const following: string[] = snap.data().following ?? [];
  return following.includes(communityUid);
}

// Community accounts only get notified about engagement from other community accounts
// (not every normal-user like/comment), to keep their inbox focused on what matters to a business.
export async function notifyCommunityInteraction(params: {
  toUid: string;
  fromUid: string;
  fromName: string;
  fromUsername: string;
  type: "community-like" | "community-comment";
  eventId: string;
  eventTitle: string;
}) {
  if (params.toUid === params.fromUid) return;
  await addDoc(collection(db, "notifications", params.toUid, "items"), {
    type: params.type,
    fromUid: params.fromUid,
    fromName: params.fromName,
    fromUsername: params.fromUsername,
    label: params.eventTitle,
    eventId: params.eventId,
    read: false,
    sentAt: serverTimestamp(),
  });
}

export async function notifyFollowersOfEvent(event: { id: string; communityName: string; communityUsername: string; title: string; communityUid: string }) {
  const followersSnap = await getDocs(query(collection(db, "users"), where("following", "array-contains", event.communityUid)));
  await Promise.all(
    followersSnap.docs.map((d) =>
      addDoc(collection(db, "notifications", d.id, "items"), {
        type: "community-event",
        fromName: event.communityName,
        fromUsername: event.communityUsername,
        label: event.title,
        eventId: event.id,
        read: false,
        sentAt: serverTimestamp(),
      })
    )
  );
}
