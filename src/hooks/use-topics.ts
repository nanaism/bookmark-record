import { Topic } from "@prisma/client";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

// APIから返される拡張されたTopic型（ブックマーク数を含む）
export interface TopicWithBookmarkCount extends Topic {
  bookmarkCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * トピック管理機能を提供するカスタムフック
 *
 * トピックの取得、作成、更新、削除機能と、選択されたトピックの
 * 状態管理を行います。初期データとSWRによるリアルタイムデータの
 * 両方に対応しています。
 */
export const useTopics = (initialTopics: TopicWithBookmarkCount[] = []) => {
  const { mutate: globalMutate } = useSWRConfig();
  const {
    data,
    error,
    mutate: localMutate,
  } = useSWR<TopicWithBookmarkCount[]>("/api/topics", fetcher);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [editingTopic, setEditingTopic] =
    useState<TopicWithBookmarkCount | null>(null);
  const [topicForm, setTopicForm] = useState({
    emoji: "",
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SWRデータが利用可能な場合はそれを使用、そうでなければ初期データを使用
  const currentTopics = data || initialTopics;
  const selectedTopic = currentTopics.find((t) => t.id === selectedTopicId);

  // トピックが存在する場合、最初のトピックを自動選択
  useEffect(() => {
    // favoritesが選択されている場合や、すでに選択肢がある場合は何もしない
    if (selectedTopicId === "favorites" || selectedTopicId) return;

    if (currentTopics.length > 0) {
      setSelectedTopicId(currentTopics[0].id);
    }
  }, [currentTopics, selectedTopicId]);

  const resetTopicForm = () => {
    setTopicForm({ emoji: "", title: "", description: "" });
    setEditingTopic(null);
  };

  const openEditTopic = (topic: TopicWithBookmarkCount) => {
    setEditingTopic(topic);
    setTopicForm({
      emoji: topic.emoji || "",
      title: topic.title,
      description: topic.description || "",
    });
  };

  const handleCreateTopic = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: topicForm.title,
          description: topicForm.description,
          emoji: topicForm.emoji || "📁",
        }),
      });

      if (response.ok) {
        const newTopic = await response.json();
        await localMutate();
        resetTopicForm();
        // 初回作成時は新しいトピックを自動選択
        setSelectedTopicId(newTopic.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating topic:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic) return false;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/topics/${editingTopic.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: topicForm.title,
          description: topicForm.description,
          emoji: topicForm.emoji,
        }),
      });

      if (response.ok) {
        await localMutate();
        resetTopicForm();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating topic:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 関連するキャッシュもすべて更新
        await localMutate(); // トピック一覧を更新
        await globalMutate(`/api/bookmarks?topicId=${topicId}`); // 削除されたトピックのブックマークキャッシュをクリア
        await globalMutate("/api/favorites"); // お気に入り一覧も更新

        const remainingTopics = currentTopics.filter((t) => t.id !== topicId);
        if (selectedTopicId === topicId) {
          // 削除されたトピックが選択中の場合
          // 残りのトピックがあれば最初のものを、なければ「お気に入り」を選択
          setSelectedTopicId(remainingTopics[0]?.id || "favorites");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting topic:", error);
      return false;
    }
  };

  return {
    // データ
    topics: currentTopics,
    selectedTopic,
    selectedTopicId,
    isLoading: !error && !data && initialTopics.length === 0,
    isError: error,

    // フォーム状態
    topicForm,
    setTopicForm,
    editingTopic,
    isSubmitting,

    // 操作関数
    setSelectedTopicId,
    openEditTopic,
    resetTopicForm,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    mutateTopics: localMutate,
  };
};
