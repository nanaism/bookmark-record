"use client";

/**
 * トピックサイドバーコンポーネント
 *
 * ブックマークを分類するトピック一覧を表示し、
 * トピックの選択・作成・編集・削除機能を提供します。
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { formatDate } from "@/lib/utils/date";
import { Bookmark, Edit, Plus, Trash2 } from "lucide-react";
import React from "react";

/**
 * TopicSidebarコンポーネントのプロパティ
 */
interface TopicSidebarProps {
  topics: TopicWithBookmarkCount[];
  selectedTopicId: string;
  onTopicSelect: (topicId: string) => void;
  onTopicEdit: (topic: TopicWithBookmarkCount) => void;
  onTopicDelete: (topicId: string) => void;
  onTopicCreate: () => void;
  showTopicModal: boolean;
  setShowTopicModal: (show: boolean) => void;
}

export const TopicSidebar: React.FC<TopicSidebarProps> = ({
  topics,
  selectedTopicId,
  onTopicSelect,
  onTopicEdit,
  onTopicDelete,
  onTopicCreate,
  showTopicModal,
  setShowTopicModal,
}) => {
  return (
    <Sidebar className="border-r border-amber-200 bg-white shadow-sm">
      {/* サイドバーヘッダー */}
      <SidebarHeader className="border-b border-amber-100 p-6 pr-0 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <Bookmark className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold font-sans text-gray-900">
              ブックマークレコード
            </h1>
            <p className="text-xs text-gray-600">シンプルにリンクを管理！</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          {/* トピック一覧のヘッダー */}
          <SidebarGroupLabel className="flex items-center justify-between px-3 py-6">
            <span className="text-sm font-semibold text-gray-700">
              トピック
            </span>
            <Dialog open={showTopicModal} onOpenChange={setShowTopicModal}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-amber-100"
                  onClick={onTopicCreate}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
            </Dialog>
          </SidebarGroupLabel>

          {/* トピック一覧 */}
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-2">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => onTopicSelect(topic.id)}
                  className={`p-3 rounded-xl border cursor-pointer shadow-sm group ${
                    selectedTopicId === topic.id
                      ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300"
                      : "bg-white border-amber-200 hover:border-amber-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0 mt-0.5">
                        {topic.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {topic.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-amber-600 font-medium">
                            {topic.bookmarkCount} 個
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(topic.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* ホバー時に表示される操作ボタン */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          // イベントバブリングを防止してトピック選択を回避
                          e.stopPropagation();
                          onTopicEdit(topic);
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              // イベントバブリングを防止してトピック選択を回避
                              e.stopPropagation();
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border border-red-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle>トピックを削除</AlertDialogTitle>
                            <AlertDialogDescription>
                              このトピックとすべてのブックマークを削除してもよろしいですか？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              キャンセル
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onTopicDelete(topic.id)}
                              className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
