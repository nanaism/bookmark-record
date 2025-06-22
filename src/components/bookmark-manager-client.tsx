"use client";

/**
 * ブックマーク管理メインコンポーネント
 *
 * トピックサイドバーとブックマークグリッドを統合し、
 * 全体的なブックマーク管理機能を提供します。
 * カスタムフックを使用して状態管理とモーダル制御を行います。
 */

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
import { Bookmark as BookmarkType } from "@prisma/client";
import { ChevronDown, ChevronUp, Plus, Upload } from "lucide-react";
import React from "react";
import { BookmarkGrid } from "./bookmark-grid";
import { BookmarkModal } from "./modals/bookmark-modal";
import { BulkAddModal } from "./modals/bulk-add-modal";
import { TopicModal } from "./modals/topic-modal";
import { TopicSidebar } from "./topic-sidebar";

/**
 * BookmarkManagerClientコンポーネントのプロパティ
 */
interface BookmarkManagerClientProps {
  initialTopics: TopicWithBookmarkCount[];
}

export const BookmarkManagerClient: React.FC<BookmarkManagerClientProps> = ({
  initialTopics,
}) => {
  // カスタムフックによる状態管理
  const topicsHook = useTopics(initialTopics);
  const bookmarksHook = useBookmarks(
    topicsHook.selectedTopicId,
    topicsHook.mutateTopics
  );
  const modalsHook = useModals(topicsHook.selectedTopicId);

  /**
   * トピックモーダルの送信処理
   * 新規作成または編集を判定して適切な処理を実行
   */
  const handleTopicModalSubmit = async () => {
    const success = topicsHook.editingTopic
      ? await topicsHook.handleUpdateTopic()
      : await topicsHook.handleCreateTopic();

    if (success) {
      modalsHook.closeTopicModal();
    }
  };

  /**
   * ブックマークモーダルの送信処理
   * 新規作成または編集を判定して適切な処理を実行
   */
  const handleBookmarkModalSubmit = async () => {
    const success = bookmarksHook.editingBookmark
      ? await bookmarksHook.handleUpdateBookmark()
      : await bookmarksHook.handleCreateBookmark();

    if (success) {
      modalsHook.closeBookmarkModal();
    }
  };

  /**
   * 一括追加モーダルの送信処理
   */
  const handleBulkModalSubmit = async () => {
    const success = await bookmarksHook.handleBulkCreate();
    if (success) {
      modalsHook.closeBulkModal();
    }
  };

  // トピック操作のハンドラー関数群
  const handleTopicCreate = () => {
    topicsHook.resetTopicForm();
    modalsHook.openTopicModal();
  };

  const handleTopicEdit = (topic: TopicWithBookmarkCount) => {
    topicsHook.openEditTopic(topic);
    modalsHook.openTopicModal();
  };

  // ブックマーク操作のハンドラー関数群
  const handleBookmarkCreate = () => {
    bookmarksHook.resetBookmarkForms();
    modalsHook.openBookmarkModal();
  };

  const handleBookmarkEdit = (bookmark: BookmarkType) => {
    bookmarksHook.openEditBookmark(bookmark);
    modalsHook.openBookmarkModal();
  };

  const handleBulkModalOpen = () => {
    bookmarksHook.resetBookmarkForms();
    modalsHook.openBulkModal();
  };

  // モーダル閉じる際のクリーンアップ処理
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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-amber-50">
        {/* トピック選択サイドバー */}
        <TopicSidebar
          topics={topicsHook.topics}
          selectedTopicId={topicsHook.selectedTopicId}
          onTopicSelect={topicsHook.setSelectedTopicId}
          onTopicEdit={handleTopicEdit}
          onTopicDelete={topicsHook.handleDeleteTopic}
          onTopicCreate={handleTopicCreate}
          showTopicModal={modalsHook.showTopicModal}
          setShowTopicModal={modalsHook.setShowTopicModal}
        />

        <SidebarInset className="flex-1">
          {/* ヘッダー */}
          <header className="flex shrink-0 items-center justify-between p-6 bg-white">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-amber-100 rounded-lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {topicsHook.selectedTopic?.title || "トピックを選択"}
                </h2>
              </div>
            </div>

            {/* トピック選択時のみ表示される操作ボタン */}
            {topicsHook.selectedTopic && (
              <div className="flex items-center gap-3">
                <Dialog
                  open={modalsHook.showBulkModal}
                  onOpenChange={modalsHook.setShowBulkModal}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200 rounded-xl"
                      onClick={handleBulkModalOpen}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      一括リンク追加
                    </Button>
                  </DialogTrigger>
                </Dialog>

                <Dialog
                  open={modalsHook.showBookmarkModal}
                  onOpenChange={modalsHook.setShowBookmarkModal}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
                      onClick={handleBookmarkCreate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新しいブックマーク
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </header>

          {/* トピック説明文セクション（長い説明文の場合のみ表示） */}
          {topicsHook.selectedTopic?.description &&
            topicsHook.selectedTopic.description.length > 100 && (
              <div className="border-b border-amber-200 bg-white px-6 py-4">
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

                {/* 長い説明文の場合は展開/折りたたみボタンを表示 */}
                {topicsHook.selectedTopic.description.length > 100 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={modalsHook.toggleDescriptionExpansion}
                    className="mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                  >
                    {modalsHook.isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        折りたたむ
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        もっと見る
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

          {/* ブックマーク一覧表示エリア */}
          <main className="flex-1 p-6 overflow-y-auto">
            <BookmarkGrid
              bookmarks={bookmarksHook.bookmarks}
              selectedTopic={topicsHook.selectedTopic}
              isLoading={!!bookmarksHook.isLoading}
              onBookmarkEdit={handleBookmarkEdit}
              onBookmarkDelete={bookmarksHook.handleDeleteBookmark}
              onBookmarkCreate={handleBookmarkCreate}
              showBookmarkModal={modalsHook.showBookmarkModal}
              setShowBookmarkModal={modalsHook.setShowBookmarkModal}
            />
          </main>
        </SidebarInset>
      </div>

      {/* モーダル群 */}
      <TopicModal
        isOpen={modalsHook.showTopicModal}
        onClose={handleTopicModalClose}
        editingTopic={topicsHook.editingTopic}
        topicForm={topicsHook.topicForm}
        setTopicForm={topicsHook.setTopicForm}
        onSubmit={handleTopicModalSubmit}
      />

      <BookmarkModal
        isOpen={modalsHook.showBookmarkModal}
        onClose={handleBookmarkModalClose}
        editingBookmark={bookmarksHook.editingBookmark}
        topics={topicsHook.topics}
        bookmarkForm={bookmarksHook.bookmarkForm}
        setBookmarkForm={bookmarksHook.setBookmarkForm}
        onSubmit={handleBookmarkModalSubmit}
      />

      <BulkAddModal
        isOpen={modalsHook.showBulkModal}
        onClose={handleBulkModalClose}
        topics={topicsHook.topics}
        bulkForm={bookmarksHook.bulkForm}
        setBulkForm={bookmarksHook.setBulkForm}
        onSubmit={handleBulkModalSubmit}
      />
    </SidebarProvider>
  );
};
