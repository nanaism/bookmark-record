import { Topic } from "@prisma/client";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

export interface TopicWithBookmarkCount extends Topic {
  bookmarkCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useTopics = (
  initialTopics: TopicWithBookmarkCount[] = [],
  isAuthenticated: boolean
) => {
  const { mutate: globalMutate } = useSWRConfig();
  const {
    data,
    error,
    mutate: localMutate,
  } = useSWR<TopicWithBookmarkCount[]>(
    isAuthenticated ? "/api/topics" : null,
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

  const currentTopics = Array.isArray(data) ? data : initialTopics;
  const selectedTopic = Array.isArray(currentTopics)
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

  const handleCreateTopic =
    async (): Promise<TopicWithBookmarkCount | null> => {
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
          return newTopic;
        }
        return null;
      } catch (error) {
        console.error("Error creating topic:", error);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    };

  const handleUpdateTopic =
    async (): Promise<TopicWithBookmarkCount | null> => {
      if (!editingTopic) return null;
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
          const updatedTopic = await response.json();
          await localMutate();
          resetTopicForm();
          return updatedTopic;
        }
        return null;
      } catch (error) {
        console.error("Error updating topic:", error);
        return null;
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
    topics: currentTopics,
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
    handleCreateTopic: handleCreateTopic, // 既存の呼び出し元のために残す
    handleUpdateTopic: handleUpdateTopic, // 既存の呼び出し元のために残す
    handleCreateTopicAndGet: handleCreateTopic, // 新しいロジック用 (実体は同じ)
    handleUpdateTopicAndGet: handleUpdateTopic, // 新しいロジック用 (実体は同じ)
    handleDeleteTopic,
    mutateTopics: localMutate,
  };
};
