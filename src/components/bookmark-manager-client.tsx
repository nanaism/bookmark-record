"use client";

/**
 * ブックマーク管理メインコンポーネント (クライアントサイド)
 *
 * ユーザーの認証状態に応じて表示を切り替え、
 * ログイン後はトピックサイドバーとブックマークグリッドを統合し、
 * 全体的なブックマーク管理機能を提供します。
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
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  Plus,
  Upload,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import { BookmarkGrid } from "./bookmark-grid";
import { BookmarkModal } from "./modals/bookmark-modal";
import { BulkAddModal } from "./modals/bulk-add-modal";
import { TopicModal } from "./modals/topic-modal";
import { TopicSidebar } from "./topic-sidebar";

/**
 * ヘッダーに表示するログイン/ログアウトボタンコンポーネント
 */
const AuthButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full border-2 border-amber-200"
          />
        )}
        <Button
          variant="outline"
          onClick={() => signOut()}
          className="rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => signIn("google")}
      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Googleでログイン
    </Button>
  );
};

/**
 * BookmarkManagerClientコンポーネントのプロパティ
 */
interface BookmarkManagerClientProps {
  initialTopics: TopicWithBookmarkCount[];
}

export const BookmarkManagerClient: React.FC<BookmarkManagerClientProps> = ({
  initialTopics,
}) => {
  // ★ セッション情報を取得
  const { data: session, status } = useSession();

  // カスタムフックによる状態管理 (ログイン後に使用)
  const topicsHook = useTopics(initialTopics);
  const bookmarksHook = useBookmarks(
    topicsHook.selectedTopicId,
    topicsHook.mutateTopics
  );
  const modalsHook = useModals(topicsHook.selectedTopicId);

  // --- 各種イベントハンドラー (ロジックは変更なし) ---
  const handleTopicModalSubmit = async () => {
    const success = topicsHook.editingTopic
      ? await topicsHook.handleUpdateTopic()
      : await topicsHook.handleCreateTopic();
    if (success) modalsHook.closeTopicModal();
  };

  const handleBookmarkModalSubmit = async () => {
    const success = bookmarksHook.editingBookmark
      ? await bookmarksHook.handleUpdateBookmark()
      : await bookmarksHook.handleCreateBookmark();
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

  // --- 表示の切り替え ---

  // ★ 認証状態をチェック中
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-amber-50">
        <p>読み込み中...</p>
      </div>
    );
  }

  // ★ 未ログインの場合の表示
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-amber-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <Bookmark className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            KokoLinkへようこそ！
          </h1>
          <p className="text-gray-600 mt-2 mb-6">
            気になる情報やサイトを、トピックごとに整理・保存・共有できる、
            あなただけのナレッジベースを作成しましょう。
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  // ★ ログイン済みの場合の表示
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
        />

        <SidebarInset className="flex-1">
          <header className="flex shrink-0 items-center justify-between p-6 bg-white">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-amber-100 rounded-lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {topicsHook.selectedTopic?.title || "トピックを選択"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* トピック選択時のみ表示される操作ボタン */}
              {topicsHook.selectedTopic && (
                <div className="flex items-center gap-3">
                  <Dialog
                    open={modalsHook.showBulkModal}
                    onOpenChange={handleBulkModalClose}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200 rounded-xl"
                        onClick={handleBulkModalOpen}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        一括追加
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <Dialog
                    open={modalsHook.showBookmarkModal}
                    onOpenChange={handleBookmarkModalClose}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
                        onClick={handleBookmarkCreate}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              )}
              {/* ★ 常に表示される認証ボタン */}
              <AuthButton />
            </div>
          </header>

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

      {/* モーダル群 (変更なし) */}
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
