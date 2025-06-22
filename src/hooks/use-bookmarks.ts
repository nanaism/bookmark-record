import { Bookmark as BookmarkType, ProcessingStatus } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useBookmarks = (
  topicId: string | null,
  isAuthenticated: boolean
) => {
  const { mutate: globalMutate } = useSWRConfig();
  const swrKey =
    isAuthenticated && topicId
      ? topicId === "favorites"
        ? "/api/favorites"
        : `/api/bookmarks?topicId=${topicId}`
      : null;

  const {
    data,
    error,
    mutate: localMutate,
  } = useSWR<BookmarkType[]>(swrKey, fetcher);

  const bookmarks = Array.isArray(data) ? data : [];

  // ポーリング用のロジック
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 処理待ちのIDがなければ、ポーリングを停止
    if (pendingIds.length === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    // 処理待ちのIDがあり、かつポーリングがまだ開始されていなければ、開始
    if (pendingIds.length > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch("/api/bookmarks/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: pendingIds }),
          });
          if (!response.ok) return;

          const statuses: {
            id: string;
            processingStatus: ProcessingStatus;
          }[] = await response.json();
          const completedOrFailedIds = statuses
            .filter(
              (s) =>
                s.processingStatus === "COMPLETED" ||
                s.processingStatus === "FAILED"
            )
            .map((s) => s.id);

          if (completedOrFailedIds.length > 0) {
            // 処理が完了したIDがあれば、リスト全体を再取得してUIを更新
            localMutate();
            // 処理が完了したIDをpendingリストから除去
            setPendingIds((prev) =>
              prev.filter((id) => !completedOrFailedIds.includes(id))
            );
          }
        } catch (e) {
          console.error("Polling failed:", e);
        }
      }, 3000); // 3秒ごとにチェック
    }

    // コンポーネントがアンマウントされた時にタイマーをクリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pendingIds, localMutate]);

  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(
    null
  );
  const [bookmarkForm, setBookmarkForm] = useState({
    topicId: topicId || "",
    url: "",
    description: "",
  });
  const [bulkForm, setBulkForm] = useState({
    topicId: topicId || "",
    urls: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(
    null
  );

  const openEditBookmark = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setBookmarkForm({
      topicId: bookmark.topicId,
      url: bookmark.url,
      description: bookmark.description || "",
    });
  };

  const resetBookmarkForms = () => {
    setBookmarkForm({ topicId: topicId || "", url: "", description: "" });
    setBulkForm({ topicId: topicId || "", urls: "" });
    setEditingBookmark(null);
  };

  const handleCreateBookmark = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: bookmarkForm.url,
          description: bookmarkForm.description,
          topicId: bookmarkForm.topicId,
        }),
      });
      if (!response.ok) throw new Error("Failed to create bookmark");

      const newBookmark: BookmarkType = await response.json();

      // 作成したブックマークをUIに即時反映＆ポーリングリストに追加
      localMutate([...bookmarks, newBookmark], false);
      setPendingIds((prev) => [...prev, newBookmark.id]);

      await globalMutate("/api/topics");
      resetBookmarkForms();
      return true;
    } catch (error) {
      console.error("Error creating bookmark:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return false;
    setIsSubmitting(true);
    let success = false;
    try {
      const response = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: bookmarkForm.url,
          description: bookmarkForm.description,
          topicId: bookmarkForm.topicId,
        }),
      });
      success = response.ok;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      success = false;
    } finally {
      if (success) {
        await localMutate();
        await globalMutate("/api/favorites");
        resetBookmarkForms();
      }
      setIsSubmitting(false);
    }
    return success;
  };

  const handleBulkCreate = async () => {
    const urls = bulkForm.urls.split("\n").filter((url) => url.trim());
    setIsSubmitting(true);
    let success = false;
    try {
      const response = await fetch("/api/bookmarks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urls.map((url) => url.trim()),
          topicId: bulkForm.topicId,
        }),
      });
      success = response.ok;
    } catch (error) {
      console.error("Error creating bulk bookmarks:", error);
      success = false;
    } finally {
      if (success) {
        await localMutate();
        await globalMutate("/api/topics");
        resetBookmarkForms();
      }
      setIsSubmitting(false);
    }
    return success;
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    let success = false;
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await localMutate();
        await globalMutate("/api/topics");
        await globalMutate("/api/favorites");
        success = true;
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
    return success;
  };

  const handleToggleFavorite = async (bookmarkId: string) => {
    setTogglingFavoriteId(bookmarkId);
    try {
      await fetch(`/api/bookmarks/${bookmarkId}/favorite`, {
        method: "PATCH",
      });
      await localMutate();
      await globalMutate("/api/favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      await localMutate();
      await globalMutate("/api/favorites");
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  return {
    bookmarks,
    isLoading: !error && !data && !!topicId,
    isError: error,
    bookmarkForm,
    setBookmarkForm,
    bulkForm,
    setBulkForm,
    editingBookmark,
    isSubmitting,
    togglingFavoriteId,
    openEditBookmark,
    resetBookmarkForms,
    handleCreateBookmark,
    handleUpdateBookmark,
    handleBulkCreate,
    handleDeleteBookmark,
    handleToggleFavorite,
    mutateBookmarks: localMutate,
  };
};
