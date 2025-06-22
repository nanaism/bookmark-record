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
  const { data, error, mutate } = useSWR<BookmarkType[]>(
    topicId ? `/api/bookmarks?topicId=${topicId}` : null,
    fetcher
  );

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

      if (response.ok) {
        // ブックマークリストとトピックリスト（ブックマーク数更新のため）を再取得
        await mutate();
        if (mutateTopics) await mutateTopics();
        resetBookmarkForms();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating bookmark:", error);
      return false;
    }
  };

  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return false;

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

      if (response.ok) {
        await mutate();
        if (mutateTopics) await mutateTopics();
        resetBookmarkForms();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      return false;
    }
  };

  /**
   * 複数のURLを一括でブックマークとして作成する
   * 改行区切りのURLテキストを解析して個別のブックマークを作成
   */
  const handleBulkCreate = async () => {
    const urls = bulkForm.urls.split("\n").filter((url) => url.trim());

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

      if (response.ok) {
        await mutate();
        if (mutateTopics) await mutateTopics();
        resetBookmarkForms();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating bulk bookmarks:", error);
      return false;
    }
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

    // 操作関数
    openEditBookmark,
    resetBookmarkForms,
    handleCreateBookmark,
    handleUpdateBookmark,
    handleBulkCreate,
    handleDeleteBookmark,
    mutateBookmarks: mutate,
  };
};
