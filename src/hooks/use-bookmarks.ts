import { Bookmark as BookmarkType } from "@prisma/client";
import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * ブックマーク管理機能を提供するカスタムフック
 *
 * 指定されたトピックのブックマークの取得、作成、更新、削除、
 * および一括作成機能を提供します。SWRを使用してデータの
 * キャッシュと自動再取得を行います。
 */
export const useBookmarks = (
  topicId: string | null,
  mutateTopics?: () => void
) => {
  // SWRを使用してブックマークデータを取得・キャッシュ
  const swrKey =
    topicId === "favorites"
      ? "/api/favorites" // topicIdが'favorites'なら専用APIを叩く
      : topicId
      ? `/api/bookmarks?topicId=${topicId}` // topicIdがあれば通常のAPI
      : null; // topicIdがなければ何もしない
  const { data, error, mutate } = useSWR<BookmarkType[]>(swrKey, fetcher);

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
  const [isSubmitting, setIsSubmitting] = useState(false); // ★ 送信中状態を追加

  // 選択されたトピックが変更された時にフォームのトピックIDを更新
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
    setIsSubmitting(true); // ★ ローディング開始
    let success = false;
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        await mutate();
        if (mutateTopics) await mutateTopics();
        resetBookmarkForms();
      }
      setIsSubmitting(false); // ★ ローディング終了
    }
    return success;
  };

  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return false;
    setIsSubmitting(true); // ★ ローディング開始
    let success = false;
    try {
      const response = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
        await mutate();
        if (mutateTopics) await mutateTopics();
        resetBookmarkForms();
      }
      setIsSubmitting(false); // ★ ローディング終了
    }
    return success;
  };

  const handleBulkCreate = async () => {
    const urls = bulkForm.urls.split("\n").filter((url) => url.trim());
    setIsSubmitting(true); // ★ ローディング開始
    let success = false;
    try {
      const response = await fetch("/api/bookmarks/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        await mutate();
        if (mutateTopics) await mutateTopics();
        resetBookmarkForms();
      }
      setIsSubmitting(false); // ★ ローディング終了
    }
    return success;
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // ブックマーク削除後、関連するデータを再取得
        await mutate();
        if (mutateTopics) await mutateTopics();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      return false;
    }
  };

  const handleToggleFavorite = async (bookmarkId: string) => {
    // UIを即時反映させるためのオプティミスティックアップデート
    mutate(
      (currentData) =>
        currentData?.map((bookmark) =>
          bookmark.id === bookmarkId
            ? { ...bookmark, isFavorite: !bookmark.isFavorite }
            : bookmark
        ),
      false // revalidateをfalseに
    );

    try {
      await fetch(`/api/bookmarks/${bookmarkId}/favorite`, {
        method: "PATCH",
      });
      // 最終的なデータで再検証
      mutate();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // エラー時は元のデータに戻す
      mutate();
    }
  };

  return {
    // データ
    bookmarks: data || [],
    isLoading: !error && !data && topicId,
    isError: error,

    // フォーム状態
    bookmarkForm,
    setBookmarkForm,
    bulkForm,
    setBulkForm,
    editingBookmark,
    isSubmitting, // ★ 返り値に追加

    // 操作関数
    openEditBookmark,
    resetBookmarkForms,
    handleCreateBookmark,
    handleUpdateBookmark,
    handleBulkCreate,
    handleDeleteBookmark,
    mutateBookmarks: mutate,
    handleToggleFavorite,
  };
};
