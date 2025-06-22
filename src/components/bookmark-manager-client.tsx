"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useModals } from "@/hooks/use-modals";
import { TopicWithBookmarkCount, useTopics } from "@/hooks/use-topics";
import { arrayMove } from "@dnd-kit/sortable";
import { Bookmark as BookmarkType } from "@prisma/client";
import {
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  Plus,
  Upload,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import { BookmarkGrid } from "./bookmark-grid";
import { BookmarkModal } from "./modals/bookmark-modal";
import { BulkAddModal } from "./modals/bulk-add-modal";
import {
  RecommendationModal,
  RecommendationResult,
} from "./modals/recommendation-modal";
import { TopicModal } from "./modals/topic-modal";
import { TopicSidebar } from "./topic-sidebar";

const AuthButton = () => {
  const { data: session } = useSession();
  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-amber-200"
          />
        )}
        <Button
          variant="outline"
          onClick={() => signOut()}
          className="rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" /> ログアウト
        </Button>
      </div>
    );
  }
  return (
    <Button
      onClick={() => signIn("google")}
      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
    >
      <LogIn className="w-4 h-4 mr-2" /> Googleでログイン
    </Button>
  );
};

interface BookmarkManagerClientProps {
  initialTopics: TopicWithBookmarkCount[];
}

export const BookmarkManagerClient: React.FC<BookmarkManagerClientProps> = ({
  initialTopics,
}) => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { mutate: globalMutate } = useSWRConfig();
  const userId = session?.user?.id;

  const topicsHook = useTopics(initialTopics, isAuthenticated);
  const bookmarksHook = useBookmarks(
    topicsHook.selectedTopicId,
    isAuthenticated
  );
  const modalsHook = useModals(topicsHook.selectedTopicId);

  const [recommendations, setRecommendations] = useState<
    RecommendationResult[]
  >([]);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [sourceBookmark, setSourceBookmark] = useState<BookmarkType | null>(
    null
  );
  const [addingBookmarkId, setAddingBookmarkId] = useState<string | null>(null);

  const [bookmarkToAddAfterTopicCreation, setBookmarkToAddAfterTopicCreation] =
    useState<RecommendationResult | null>(null);

  const handleFetchRecommendations = async (bookmark: BookmarkType) => {
    setSourceBookmark(bookmark);
    setRecommendations([]);
    modalsHook.openRecommendationModal();
    setIsRecommendationLoading(true);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bookmark.url }),
      });
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error(error);
      setRecommendations([]);
    } finally {
      setIsRecommendationLoading(false);
    }
  };

  const handleAddRecommendation = async (
    rec: RecommendationResult,
    topicId: string
  ) => {
    if (!topicId) {
      alert("ブックマークの追加先となるトピックを選択してください。");
      return;
    }
    setAddingBookmarkId(rec.id);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: rec.url,
          topicId: topicId,
          description: rec.ogDescription || "",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add bookmark");
      }
      await globalMutate(`/api/bookmarks?topicId=${topicId}`);
      await globalMutate("/api/topics");
      setRecommendations((prev) => prev.filter((item) => item.id !== rec.id));
    } catch (error) {
      console.error(error);
      alert("ブックマークの追加に失敗しました。");
    } finally {
      setAddingBookmarkId(null);
    }
  };

  const getHeaderTitle = () => {
    if (topicsHook.selectedTopicId === "favorites") {
      return "お気に入り";
    }
    return topicsHook.selectedTopic?.title || "トピックを選択";
  };

  const handleTopicModalSubmit = async () => {
    const newTopic = await (topicsHook.editingTopic
      ? topicsHook.handleUpdateTopic()
      : topicsHook.handleCreateTopic());

    if (newTopic) {
      modalsHook.closeTopicModal();
      if (bookmarkToAddAfterTopicCreation) {
        await handleAddRecommendation(
          bookmarkToAddAfterTopicCreation,
          newTopic.id
        );
        setBookmarkToAddAfterTopicCreation(null);
      }
    }
  };

  const handleTopicCreateForBookmark = (rec: RecommendationResult) => {
    setBookmarkToAddAfterTopicCreation(rec);
    modalsHook.closeRecommendationModal();
    topicsHook.resetTopicForm();
    modalsHook.openTopicModal();
  };

  const handleBookmarkModalSubmit = async () => {
    const success = await (bookmarksHook.editingBookmark
      ? bookmarksHook.handleUpdateBookmark()
      : bookmarksHook.handleCreateBookmark());
    if (success) modalsHook.closeBookmarkModal();
  };

  const handleBulkModalSubmit = async () => {
    const success = await bookmarksHook.handleBulkCreate();
    if (success) modalsHook.closeBulkModal();
  };

  const handleTopicCreate = () => {
    topicsHook.resetTopicForm();
    modalsHook.openTopicModal();
  };

  const handleTopicEdit = (topic: TopicWithBookmarkCount) => {
    topicsHook.openEditTopic(topic);
    modalsHook.openTopicModal();
  };

  const handleBookmarkEdit = (bookmark: BookmarkType) => {
    bookmarksHook.openEditBookmark(bookmark);
    modalsHook.openBookmarkModal();
  };

  const handleTopicModalClose = () => {
    modalsHook.closeTopicModal();
    topicsHook.resetTopicForm();
  };

  const handleBookmarkModalClose = () => {
    modalsHook.closeBookmarkModal();
    bookmarksHook.resetBookmarkForms();
  };

  const handleBulkModalClose = () => {
    modalsHook.closeBulkModal();
    bookmarksHook.resetBookmarkForms();
  };

  const handleBookmarkOrderChange = (activeId: string, overId: string) => {
    const oldIndex = bookmarksHook.bookmarks.findIndex(
      (b) => b.id === activeId
    );
    const newIndex = bookmarksHook.bookmarks.findIndex((b) => b.id === overId);
    const newOrderBookmarks = arrayMove(
      bookmarksHook.bookmarks,
      oldIndex,
      newIndex
    );
    bookmarksHook.mutateBookmarks(newOrderBookmarks, false);
    fetch("/api/bookmarks/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newOrderBookmarks.map((b) => b.id) }),
    }).catch(() => {
      bookmarksHook.mutateBookmarks();
    });
  };

  const handleTopicOrderChange = (activeId: string, overId: string) => {
    const oldIndex = topicsHook.topics.findIndex((t) => t.id === activeId);
    const newIndex = topicsHook.topics.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrderTopics = arrayMove(topicsHook.topics, oldIndex, newIndex);
    topicsHook.mutateTopics(newOrderTopics, false);
    fetch("/api/topics/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newOrderTopics.map((t) => t.id) }),
    }).catch(() => {
      topicsHook.mutateTopics();
    });
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-amber-50">
        <p>読み込み中...</p>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-amber-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow border">
              <Image
                src="/favicon.ico"
                alt="Chienowa Favicon"
                width={80}
                height={80}
                className="rounded-full"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-sans font-bold text-gray-900">
            Chienowa
          </h1>
          <p className="text-gray-600 mt-2 mb-6">
            世界最高のナレッジベースを作成しよう。
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-amber-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow border">
              <Image
                src="/favicon.ico"
                alt="Chienowa Favicon"
                width={80}
                height={80}
                className="rounded-full"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-sans font-bold text-gray-900">
            Chienowa
          </h1>
          <p className="text-gray-600 mt-2 mb-6">
            世界最高のナレッジベースを作成しよう。
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  const userTopics = topicsHook.topics.filter(
    (topic) => topic.userId === userId
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-amber-50">
        <TopicSidebar
          topics={topicsHook.topics}
          selectedTopicId={topicsHook.selectedTopicId}
          onTopicSelect={topicsHook.setSelectedTopicId}
          onTopicEdit={handleTopicEdit}
          onTopicDelete={topicsHook.handleDeleteTopic}
          onTopicCreate={handleTopicCreate}
          showTopicModal={modalsHook.showTopicModal}
          setShowTopicModal={modalsHook.setShowTopicModal}
          onOrderChange={handleTopicOrderChange}
          currentUserId={userId}
        />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex shrink-0 items-center justify-between p-6 bg-white border-b border-amber-200">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-amber-100 rounded-lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {getHeaderTitle()}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {topicsHook.selectedTopic && (
                <div className="flex items-center gap-3">
                  <Dialog
                    open={modalsHook.showBulkModal}
                    onOpenChange={(isOpen) => {
                      if (isOpen) bookmarksHook.resetBookmarkForms();
                      modalsHook.setShowBulkModal(isOpen);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200 rounded-xl"
                      >
                        <Upload className="h-4 w-4 mr-2" /> 一括追加
                      </Button>
                    </DialogTrigger>
                    <BulkAddModal
                      isOpen={modalsHook.showBulkModal}
                      onClose={handleBulkModalClose}
                      topics={topicsHook.topics}
                      bulkForm={bookmarksHook.bulkForm}
                      setBulkForm={bookmarksHook.setBulkForm}
                      onSubmit={handleBulkModalSubmit}
                      isSubmitting={bookmarksHook.isSubmitting}
                    />
                  </Dialog>
                  <Dialog
                    open={modalsHook.showBookmarkModal}
                    onOpenChange={(isOpen) => {
                      if (isOpen) bookmarksHook.resetBookmarkForms();
                      modalsHook.setShowBookmarkModal(isOpen);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm">
                        <Plus className="h-4 w-4 mr-2" /> 追加
                      </Button>
                    </DialogTrigger>
                    <BookmarkModal
                      isOpen={modalsHook.showBookmarkModal}
                      onClose={handleBookmarkModalClose}
                      editingBookmark={bookmarksHook.editingBookmark}
                      topics={topicsHook.topics}
                      bookmarkForm={bookmarksHook.bookmarkForm}
                      setBookmarkForm={bookmarksHook.setBookmarkForm}
                      onSubmit={handleBookmarkModalSubmit}
                      isSubmitting={bookmarksHook.isSubmitting}
                    />
                  </Dialog>
                </div>
              )}
              <AuthButton />
            </div>
          </header>
          <div className="flex-1 flex flex-col overflow-hidden">
            {topicsHook.selectedTopic?.description && (
              <div className="shrink-0 border-b border-amber-200 bg-white px-6 py-4">
                <div
                  className={`text-gray-700 leading-relaxed ${
                    !modalsHook.isDescriptionExpanded &&
                    topicsHook.selectedTopic.description.length > 100
                      ? "line-clamp-3"
                      : ""
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {topicsHook.selectedTopic.description}
                </div>
                {topicsHook.selectedTopic.description.length > 100 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={modalsHook.toggleDescriptionExpansion}
                    className="mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                  >
                    {modalsHook.isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" /> 折りたたむ
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" /> もっと見る
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            <main className="flex-1 p-6 overflow-y-auto">
              <BookmarkGrid
                bookmarks={bookmarksHook.bookmarks}
                selectedTopic={topicsHook.selectedTopic}
                isLoading={!!bookmarksHook.isLoading}
                onBookmarkEdit={handleBookmarkEdit}
                onBookmarkDelete={bookmarksHook.handleDeleteBookmark}
                onBookmarkFavoriteToggle={bookmarksHook.handleToggleFavorite}
                onBookmarkCreate={() => {
                  bookmarksHook.resetBookmarkForms();
                  modalsHook.openBookmarkModal();
                }}
                togglingFavoriteId={bookmarksHook.togglingFavoriteId}
                onFetchRecommendations={handleFetchRecommendations}
                onOrderChange={handleBookmarkOrderChange}
                currentUserId={userId}
              />
            </main>
          </div>
        </SidebarInset>
      </div>
      <TopicModal
        isOpen={modalsHook.showTopicModal}
        onClose={handleTopicModalClose}
        editingTopic={topicsHook.editingTopic}
        topicForm={topicsHook.topicForm}
        setTopicForm={topicsHook.setTopicForm}
        onSubmit={handleTopicModalSubmit}
        isSubmitting={topicsHook.isSubmitting}
      />
      <RecommendationModal
        isOpen={modalsHook.showRecommendationModal}
        onClose={modalsHook.closeRecommendationModal}
        sourceUrl={sourceBookmark?.url || null}
        recommendations={recommendations}
        isLoading={isRecommendationLoading}
        onAddBookmark={handleAddRecommendation}
        addingBookmarkId={addingBookmarkId}
        userTopics={userTopics}
        onTopicCreate={handleTopicCreateForBookmark}
      />
    </SidebarProvider>
  );
};
