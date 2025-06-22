import { Bookmark as BookmarkType } from "@prisma/client";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * ブックマーク管理機能を提供するカスタムフック
 *
 * 指定されたトピックのブックマークの取得、作成、更新、削除、
 * および一括作成機能を提供します。SWRを使用してデータの
 * キャッシュと自動再取得を行います。
 */
export const useBookmarks = (topicId: string | null) => {
  const { mutate: globalMutate } = useSWRConfig();
  const swrKey =
    topicId === "favorites"
      ? "/api/favorites"
      : topicId
      ? `/api/bookmarks?topicId=${topicId}`
      : null;
  const {
    data,
    error,
    mutate: localMutate,
  } = useSWR<BookmarkType[]>(swrKey, fetcher);

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

  useEffect(() => {
    setBookmarkForm((prev) => ({ ...prev, topicId: topicId || "" }));
    setBulkForm((prev) => ({ ...prev, topicId: topicId || "" }));
  }, [topicId]);

  const resetBookmarkForms = () => {
    setBookmarkForm({ topicId: topicId || "", url: "", description: "" });
    setBulkForm({ topicId: topicId || "", urls: "" });
    setEditingBookmark(null);
  };

  const openEditBookmark = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setBookmarkForm({
      topicId: bookmark.topicId,
      url: bookmark.url,
      description: bookmark.description || "",
    });
  };

  const handleCreateBookmark = async () => {
    setIsSubmitting(true);
    let success = false;
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
      success = response.ok;
    } catch (error) {
      console.error("Error creating bookmark:", error);
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
    bookmarks: data || [],
    isLoading: !error && !data && topicId,
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
