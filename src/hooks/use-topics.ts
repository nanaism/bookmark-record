import { Topic } from "@prisma/client";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

export interface TopicWithBookmarkCount extends Topic {
  bookmarkCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * トピック管理機能を提供するカスタムフック
 */
export const useTopics = (
  initialTopics: TopicWithBookmarkCount[] = [],
  isAuthenticated: boolean // ★ 引数を追加
) => {
  const { mutate: globalMutate } = useSWRConfig();
  const {
    data,
    error,
    mutate: localMutate,
  } = useSWR<TopicWithBookmarkCount[]>(
    isAuthenticated ? "/api/topics" : null, // ★ ログイン時のみAPIを叩く
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTopics = data || initialTopics;
  const selectedTopic = Array.isArray(currentTopics) // ★ currentTopicsが配列であることを保証
    ? currentTopics.find((t) => t.id === selectedTopicId)
    : undefined;

  useEffect(() => {
    if (selectedTopicId === "favorites" || selectedTopicId) return;
    if (
      currentTopics &&
      Array.isArray(currentTopics) &&
      currentTopics.length > 0
    ) {
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
        await localMutate();
        await globalMutate(`/api/bookmarks?topicId=${topicId}`);
        await globalMutate("/api/favorites");

        const remainingTopics = Array.isArray(currentTopics)
          ? currentTopics.filter((t) => t.id !== topicId)
          : [];
        if (selectedTopicId === topicId) {
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
    topics: Array.isArray(currentTopics) ? currentTopics : [],
    selectedTopic,
    selectedTopicId,
    isLoading: !error && !data && isAuthenticated,
    isError: error,
    topicForm,
    setTopicForm,
    editingTopic,
    isSubmitting,
    setSelectedTopicId,
    openEditTopic,
    resetTopicForm,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    mutateTopics: localMutate,
  };
};
