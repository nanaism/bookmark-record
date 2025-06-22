import { Topic } from "@prisma/client";
import { useEffect, useState } from "react";
import useSWR from "swr";

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
  const { data, error, mutate } = useSWR<TopicWithBookmarkCount[]>(
    "/api/topics",
    fetcher
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [editingTopic, setEditingTopic] =
    useState<TopicWithBookmarkCount | null>(null);
  const [topicForm, setTopicForm] = useState({
    emoji: "",
    title: "",
    description: "",
  });

  // SWRデータが利用可能な場合はそれを使用、そうでなければ初期データを使用
  const currentTopics = data && data.length > 0 ? data : initialTopics;
  const selectedTopic = currentTopics.find((t) => t.id === selectedTopicId);

  // トピックが存在する場合、最初のトピックを自動選択
  useEffect(() => {
    if (currentTopics.length > 0 && !selectedTopicId) {
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
        await mutate();
        resetTopicForm();
        // 初回作成時は新しいトピックを自動選択
        if (!selectedTopicId) {
          setSelectedTopicId(newTopic.id);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating topic:", error);
      return false;
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic) return false;

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
        await mutate();
        resetTopicForm();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating topic:", error);
      return false;
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await mutate();
        // 削除されたトピックが選択中の場合、残りのトピックから最初のものを選択
        if (selectedTopicId === topicId && currentTopics.length > 1) {
          const remainingTopics = currentTopics.filter((t) => t.id !== topicId);
          setSelectedTopicId(remainingTopics[0]?.id || "");
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

    // 操作関数
    setSelectedTopicId,
    openEditTopic,
    resetTopicForm,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    mutateTopics: mutate,
  };
};
