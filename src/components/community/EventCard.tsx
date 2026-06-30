"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  collection, onSnapshot, orderBy, query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  CommunityEvent, EventComment, toggleEventLike, addEventComment,
  deleteEventComment, reportComment, followCommunity, unfollowCommunity,
  toggleCommentLike, pinComment, unpinComment, notifyCommunityInteraction,
} from "@/lib/community-utils";
import type { CommentLiker } from "@/lib/community-utils";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import toast from "react-hot-toast";
import {
  Heart, MessageCircle, Share2, MapPin, Calendar, Clock,
  ExternalLink, Pencil, Trash2, Flag, X, Send, ChevronDown, Pin, Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Avatar({ name, photoURL, size = 36 }: { name: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoURL} alt={name} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    );
  }
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
      {initials || "?"}
    </div>
  );
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function EventCard({
  event,
  mode = "public",
  onEdit,
  onDelete,
  onDuplicate,
}: {
  event: CommunityEvent;
  mode?: "owner" | "public";
  onEdit?: (event: CommunityEvent) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: CommunityEvent) => void;
}) {
  const { user, profile } = useAuth();
  const [likeUids, setLikeUids] = useState<string[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [following, setFollowing] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "communityEvents", event.id, "likes"), snap => {
      setLikeUids(snap.docs.map(d => d.id));
    });
    return unsub;
  }, [event.id]);

  useEffect(() => {
    const q = query(collection(db, "communityEvents", event.id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventComment)));
    });
    return unsub;
  }, [event.id]);

  useEffect(() => {
    if (!profile?.following) { setFollowing(false); return; }
    setFollowing(profile.following.includes(event.communityUid));
  }, [profile?.following, event.communityUid]);

  const liked = !!user && likeUids.includes(user.uid);
  const isOwnEvent = user?.uid === event.communityUid;
  const isCommunityViewer = profile?.accountType === "community";

  // Separate top-level comments and replies
  const topLevelComments = comments.filter(c => !c.parentId);
  const allReplies = comments.filter(c => !!c.parentId);
  const pinnedComment = event.pinnedCommentId
    ? comments.find(c => c.id === event.pinnedCommentId) ?? null
    : null;
  const regularComments = topLevelComments.filter(c => c.id !== event.pinnedCommentId);
  const orderedComments = pinnedComment ? [pinnedComment, ...regularComments] : regularComments;

  async function handleLike() {
    if (!user) { toast.error("Sign in to like events."); return; }
    try {
      await toggleEventLike(event.id, user.uid, liked);
      if (!liked && isCommunityViewer) {
        notifyCommunityInteraction({
          toUid: event.communityUid,
          fromUid: user.uid,
          fromName: profile?.displayName ?? "A community",
          fromUsername: profile?.username ?? "",
          type: "community-like",
          eventId: event.id,
          eventTitle: event.title,
        }).catch(() => {});
      }
    } catch {
      toast.error("Couldn't update like. Try again.");
    }
  }

  async function handleFollow() {
    if (!user) { toast.error("Sign in to follow communities."); return; }
    try {
      if (following) {
        await unfollowCommunity(user.uid, event.communityUid);
      } else {
        await followCommunity(user.uid, event.communityUid);
        toast.success(`Following ${event.communityName}`);
      }
    } catch {
      toast.error("Couldn't update follow status.");
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/community?event=${event.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, text: event.description, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }

  async function handlePostComment() {
    if (!user || !commentText.trim()) return;
    setPosting(true);
    try {
      await addEventComment(event.id, {
        authorUid: user.uid,
        authorName: profile?.displayName ?? "User",
        authorUsername: profile?.username ?? "",
        authorPhotoURL: profile?.photoURL ?? null,
        authorIsCommunity: profile?.accountType === "community",
        text: commentText.trim(),
      });
      if (isCommunityViewer) {
        notifyCommunityInteraction({
          toUid: event.communityUid,
          fromUid: user.uid,
          fromName: profile?.displayName ?? "A community",
          fromUsername: profile?.username ?? "",
          type: "community-comment",
          eventId: event.id,
          eventTitle: event.title,
        }).catch(() => {});
      }
      setCommentText("");
    } catch {
      toast.error("Couldn't post comment.");
    } finally {
      setPosting(false);
    }
  }

  async function handlePostReply(parentId: string) {
    if (!user || !replyText.trim()) return;
    setPostingReply(true);
    try {
      await addEventComment(event.id, {
        authorUid: user.uid,
        authorName: profile?.displayName ?? "User",
        authorUsername: profile?.username ?? "",
        authorPhotoURL: profile?.photoURL ?? null,
        authorIsCommunity: profile?.accountType === "community",
        text: replyText.trim(),
        parentId,
      });
      if (isCommunityViewer) {
        notifyCommunityInteraction({
          toUid: event.communityUid,
          fromUid: user.uid,
          fromName: profile?.displayName ?? "A community",
          fromUsername: profile?.username ?? "",
          type: "community-comment",
          eventId: event.id,
          eventTitle: event.title,
        }).catch(() => {});
      }
      setReplyText("");
      setReplyingTo(null);
    } catch {
      toast.error("Couldn't post reply.");
    } finally {
      setPostingReply(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteEventComment(event.id, commentId);
    } catch {
      toast.error("Couldn't delete comment.");
    }
  }

  async function handleToggleCommentLike(commentId: string, currentlyLiked: boolean) {
    if (!user) { toast.error("Sign in to like comments."); return; }
    const liker: CommentLiker = {
      uid: user.uid,
      name: profile?.displayName ?? "User",
      photoURL: profile?.photoURL ?? null,
      isCommunity: profile?.accountType === "community",
    };
    try {
      await toggleCommentLike(event.id, commentId, liker, currentlyLiked);
    } catch {
      toast.error("Couldn't update.");
    }
  }

  async function handlePin(commentId: string) {
    try {
      if (event.pinnedCommentId === commentId) {
        await unpinComment(event.id);
      } else {
        await pinComment(event.id, commentId);
      }
    } catch {
      toast.error("Couldn't update pin.");
    }
  }

  async function handleSubmitReport(comment: EventComment) {
    if (!user || !reportReason.trim()) { toast.error("Please add a short reason."); return; }
    try {
      await reportComment({
        eventId: event.id,
        eventTitle: event.title,
        commentId: comment.id,
        commentText: comment.text,
        reporterUid: user.uid,
        reporterName: profile?.displayName ?? profile?.username ?? "User",
        reporterType: isCommunityViewer ? "community" : "user",
        targetAuthorUid: comment.authorUid,
        targetAuthorName: comment.authorName,
        reason: reportReason.trim(),
      });
      toast.success("Report submitted. Our team will review it.");
      setReportingId(null);
      setReportReason("");
    } catch {
      toast.error("Couldn't submit report.");
    }
  }

  function timeAgo(ts: unknown) {
    const t = ts as { toMillis?: () => number } | null;
    if (!t?.toMillis) return "";
    const diff = Date.now() - t.toMillis();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <Link href={`/profile/${event.communityUsername}`} className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
          <Avatar name={event.communityName} photoURL={event.communityPhotoURL} size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{event.communityName}</p>
              <VerifiedBadge size={13} />
            </div>
            <p className="text-xs text-slate-400">@{event.communityUsername}</p>
          </div>
        </Link>

        {mode === "owner" ? (
          <div ref={menuRef} className="flex items-center gap-1 flex-shrink-0">
            {onDuplicate && (
              <button onClick={() => onDuplicate(event)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                title="Duplicate event">
                <Copy size={13} />
              </button>
            )}
            <button onClick={() => onEdit?.(event)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit event">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete?.(event.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete event">
              <Trash2 size={14} />
            </button>
          </div>
        ) : !isOwnEvent && !isCommunityViewer && (
          <button onClick={handleFollow}
            className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              following
                ? "bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-400"
                : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
            }`}>
            {following ? "Following" : "+ Follow"}
          </button>
        )}
      </div>

      {/* Photo */}
      {event.photoURL && (
        event.photoAspectRatio ? (
          <div className="relative w-full overflow-hidden"
            style={{ aspectRatio: event.photoAspectRatio.replace(":", " / ") }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.photoURL} alt="" aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70 pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.photoURL} alt={event.title} className="relative z-10 w-full h-full object-contain" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.photoURL} alt={event.title} className="w-full" />
        )
      )}

      {/* Body */}
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-base font-bold text-slate-900 mb-1.5">{event.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-3">{event.description}</p>

        <div className="space-y-1.5 mb-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={13} className="text-blue-500 flex-shrink-0" />
            {formatEventDate(event.date)}
            {event.time && (
              <span className="flex items-center gap-1 ml-1.5"><Clock size={12} className="text-blue-400" />{event.time}</span>
            )}
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <MapPin size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <span>{event.venueName}{event.venueName && event.address ? ", " : ""}{event.address}{event.city ? `, ${event.city}` : ""}</span>
          </div>
          {event.externalLink && (
            <a href={event.externalLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline">
              <ExternalLink size={12} /> More info
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-50">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            liked ? "text-rose-600" : "text-slate-500 hover:bg-slate-50"
          }`}>
          <Heart size={15} className={liked ? "fill-rose-600" : ""} />
          {likeUids.length > 0 && likeUids.length}
        </button>
        <button onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
          <MessageCircle size={15} />
          {comments.length > 0 && comments.length}
          <ChevronDown size={12} className={`transition-transform ${showComments ? "rotate-180" : ""}`} />
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors ml-auto">
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-50"
          >
            <div className="px-5 py-3 space-y-4 max-h-[32rem] overflow-y-auto">
              {orderedComments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first to comment.</p>
              )}
              {orderedComments.map(c => {
                const isPinned = c.id === event.pinnedCommentId;
                const commentReplies = allReplies.filter(r => r.parentId === c.id);
                const commentLikers = Object.values(c.likedBy ?? {});
                const commentLikeCount = commentLikers.length;
                const communityLiker = commentLikers.find(l => l.isCommunity) ?? null;
                const isLikedByMe = !!(user && c.likedBy?.[user.uid]);
                return (
                  <div key={c.id}>
                    {/* Pinned badge */}
                    {isPinned && (
                      <div className="flex items-center gap-1 mb-1.5 px-0.5">
                        <Pin size={9} className="text-blue-400" />
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Pinned</span>
                      </div>
                    )}
                    <div className={isPinned ? "bg-blue-50/60 border border-blue-100/80 rounded-2xl p-2.5" : ""}>
                      <div className="flex items-start gap-2.5">
                        <Avatar name={c.authorName} photoURL={c.authorPhotoURL} size={28} />
                        <div className="flex-1 min-w-0">
                          {/* Comment bubble */}
                          <div className="bg-slate-50 rounded-2xl px-3 py-2">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-semibold text-slate-800">{c.authorName}</p>
                              {c.authorIsCommunity && <VerifiedBadge size={11} />}
                            </div>
                            <p className="text-sm text-slate-700 leading-snug">{c.text}</p>
                          </div>

                          {/* Community-account liked indicator (only visible when a community liked the comment) */}
                          {communityLiker && (
                            <div className="flex items-center gap-1.5 mt-1 ml-1">
                              <div className="relative flex-shrink-0">
                                <Avatar name={communityLiker.name} photoURL={communityLiker.photoURL} size={16} />
                                <Heart size={8} className="absolute -bottom-0.5 -right-1 fill-rose-500 text-rose-500 drop-shadow-[0_0_1.5px_rgba(255,255,255,0.9)]" />
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Liked by <span className="font-medium text-slate-600">{communityLiker.name}</span>
                              </span>
                            </div>
                          )}

                          {/* Action row */}
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 ml-1">
                            <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>

                            {/* Reply */}
                            {user && (
                              <button
                                onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(""); }}
                                className="text-[10px] text-slate-400 hover:text-blue-500 font-medium"
                              >
                                Reply
                              </button>
                            )}

                            {/* Like with count (any signed-in user) */}
                            {user && (
                              <button
                                onClick={() => handleToggleCommentLike(c.id, isLikedByMe)}
                                className={`text-[10px] font-medium flex items-center gap-0.5 ${
                                  isLikedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
                                }`}
                              >
                                <Heart size={9} className={isLikedByMe ? "fill-rose-500" : ""} />
                                {isLikedByMe ? "Liked" : "Like"}
                                {commentLikeCount > 0 && <span className="ml-0.5 tabular-nums">{commentLikeCount}</span>}
                              </button>
                            )}

                            {/* Pin (event owner only) */}
                            {isOwnEvent && (
                              <button
                                onClick={() => handlePin(c.id)}
                                className={`text-[10px] font-medium flex items-center gap-0.5 ${
                                  isPinned ? "text-blue-500" : "text-slate-400 hover:text-blue-400"
                                }`}
                              >
                                <Pin size={9} />
                                {isPinned ? "Unpin" : "Pin"}
                              </button>
                            )}

                            {/* Delete own */}
                            {user && user.uid === c.authorUid && (
                              <button onClick={() => handleDeleteComment(c.id)}
                                className="text-[10px] text-slate-400 hover:text-red-500 font-medium">
                                Delete
                              </button>
                            )}

                            {/* Remove (event owner) */}
                            {user && isOwnEvent && user.uid !== c.authorUid && (
                              <button onClick={() => handleDeleteComment(c.id)}
                                className="text-[10px] text-slate-400 hover:text-red-500 font-medium">
                                Remove
                              </button>
                            )}

                            {/* Report (non-owner, not own comment) */}
                            {user && user.uid !== c.authorUid && !isOwnEvent && (
                              <button onClick={() => setReportingId(c.id)}
                                className="text-[10px] text-slate-400 hover:text-amber-600 font-medium flex items-center gap-0.5">
                                <Flag size={9} /> Report
                              </button>
                            )}
                          </div>

                          {/* Report form */}
                          {reportingId === c.id && (
                            <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[11px] font-semibold text-amber-800">Report this comment</p>
                                <button onClick={() => { setReportingId(null); setReportReason(""); }} className="text-amber-400 hover:text-amber-600">
                                  <X size={12} />
                                </button>
                              </div>
                              <input
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                                placeholder="Why are you reporting this?"
                                className="w-full text-xs rounded-lg border border-amber-200 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                              />
                              <button onClick={() => handleSubmitReport(c)}
                                className="mt-1.5 text-[11px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-3 py-1.5 transition-colors">
                                Submit report
                              </button>
                            </div>
                          )}

                          {/* Replies */}
                          {commentReplies.length > 0 && (
                            <div className="mt-2 ml-1 space-y-2 border-l-2 border-slate-100 pl-3">
                              {commentReplies.map(reply => {
                                const replyLikers = Object.values(reply.likedBy ?? {});
                                const replyLikeCount = replyLikers.length;
                                const replyCommunityLiker = replyLikers.find(l => l.isCommunity) ?? null;
                                const isReplyLikedByMe = !!(user && reply.likedBy?.[user.uid]);
                                return (
                                <div key={reply.id} className="flex items-start gap-2">
                                  <Avatar name={reply.authorName} photoURL={reply.authorPhotoURL} size={22} />
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-slate-50/80 rounded-xl px-2.5 py-1.5">
                                      <div className="flex items-center gap-1">
                                        <p className="text-[11px] font-semibold text-slate-800">{reply.authorName}</p>
                                        {reply.authorIsCommunity && <VerifiedBadge size={9} />}
                                      </div>
                                      <p className="text-xs text-slate-700 leading-snug">{reply.text}</p>
                                    </div>

                                    {/* Community-account liked indicator for replies */}
                                    {replyCommunityLiker && (
                                      <div className="flex items-center gap-1.5 mt-1 ml-1">
                                        <div className="relative flex-shrink-0">
                                          <Avatar name={replyCommunityLiker.name} photoURL={replyCommunityLiker.photoURL} size={14} />
                                          <Heart size={7} className="absolute -bottom-0.5 -right-1 fill-rose-500 text-rose-500 drop-shadow-[0_0_1.5px_rgba(255,255,255,0.9)]" />
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                          Liked by <span className="font-medium text-slate-600">{replyCommunityLiker.name}</span>
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center flex-wrap gap-x-2 mt-0.5 ml-1">
                                      <span className="text-[10px] text-slate-400">{timeAgo(reply.createdAt)}</span>
                                      {user && (
                                        <button
                                          onClick={() => { setReplyingTo(c.id); setReplyText(`@${reply.authorUsername || reply.authorName} `); }}
                                          className="text-[10px] text-slate-400 hover:text-blue-500 font-medium"
                                        >
                                          Reply
                                        </button>
                                      )}
                                      {user && (
                                        <button
                                          onClick={() => handleToggleCommentLike(reply.id, isReplyLikedByMe)}
                                          className={`text-[10px] font-medium flex items-center gap-0.5 ${
                                            isReplyLikedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
                                          }`}
                                        >
                                          <Heart size={9} className={isReplyLikedByMe ? "fill-rose-500" : ""} />
                                          {isReplyLikedByMe ? "Liked" : "Like"}
                                          {replyLikeCount > 0 && <span className="ml-0.5 tabular-nums">{replyLikeCount}</span>}
                                        </button>
                                      )}
                                      {user && user.uid === reply.authorUid && (
                                        <button onClick={() => handleDeleteComment(reply.id)}
                                          className="text-[10px] text-slate-400 hover:text-red-500 font-medium">
                                          Delete
                                        </button>
                                      )}
                                      {user && isOwnEvent && user.uid !== reply.authorUid && (
                                        <button onClick={() => handleDeleteComment(reply.id)}
                                          className="text-[10px] text-slate-400 hover:text-red-500 font-medium">
                                          Remove
                                        </button>
                                      )}
                                      {user && user.uid !== reply.authorUid && !isOwnEvent && (
                                        <button onClick={() => setReportingId(reply.id)}
                                          className="text-[10px] text-slate-400 hover:text-amber-600 font-medium flex items-center gap-0.5">
                                          <Flag size={9} /> Report
                                        </button>
                                      )}
                                    </div>
                                    {reportingId === reply.id && (
                                      <div className="mt-1.5 bg-amber-50 border border-amber-100 rounded-xl p-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="text-[11px] font-semibold text-amber-800">Report reply</p>
                                          <button onClick={() => { setReportingId(null); setReportReason(""); }}
                                            className="text-amber-400 hover:text-amber-600">
                                            <X size={11} />
                                          </button>
                                        </div>
                                        <input
                                          value={reportReason}
                                          onChange={e => setReportReason(e.target.value)}
                                          placeholder="Why are you reporting this?"
                                          className="w-full text-xs rounded-lg border border-amber-200 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                                        />
                                        <button onClick={() => handleSubmitReport(reply)}
                                          className="mt-1.5 text-[11px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-3 py-1.5 transition-colors">
                                          Submit report
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Reply input */}
                          {replyingTo === c.id && user && (
                            <div className="flex items-center gap-1.5 mt-2 ml-1">
                              <Avatar name={profile?.displayName ?? "User"} photoURL={profile?.photoURL} size={22} />
                              <input
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !postingReply) handlePostReply(c.id); }}
                                placeholder={`Reply to ${c.authorName}…`}
                                className="flex-1 text-xs bg-slate-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-400"
                                autoFocus
                              />
                              <button onClick={() => handlePostReply(c.id)}
                                disabled={postingReply || !replyText.trim()}
                                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0">
                                <Send size={12} />
                              </button>
                              <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {user && (
              <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-50">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !posting) handlePostComment(); }}
                  placeholder="Write a comment..."
                  className="flex-1 text-sm bg-slate-50 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-400"
                />
                <button onClick={handlePostComment} disabled={posting || !commentText.trim()}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors">
                  <Send size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
