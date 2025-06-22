"use client";

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
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Plus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import React, { useId } from "react"; // ★ useId をインポート

// D&D用のラッパーコンポーネント
const SortableTopicItem: React.FC<{
  topic: TopicWithBookmarkCount;
  children: React.ReactNode;
}> = ({ topic, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: topic.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 opacity-30 group-hover:opacity-100 transition-opacity cursor-grab z-10"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
};

interface TopicSidebarProps {
  topics: TopicWithBookmarkCount[];
  selectedTopicId: string;
  onTopicSelect: (topicId: string) => void;
  onTopicEdit: (topic: TopicWithBookmarkCount) => void;
  onTopicDelete: (topicId: string) => void;
  onTopicCreate: () => void;
  showTopicModal: boolean;
  setShowTopicModal: (show: boolean) => void;
  onOrderChange: (activeId: string, overId: string) => void;
  currentUserId?: string | null; // ★ propsを追加
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
  onOrderChange,
  currentUserId, // ★ propsを受け取る
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const dndId = useId(); // ★ 安定したIDを生成

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onOrderChange(active.id as string, over.id as string);
    }
  };

  return (
    <Sidebar className="border-r border-amber-200 bg-white shadow-sm">
      {/* サイドバーヘッダー */}
      <SidebarHeader className="border-b border-amber-100 p-6 pr-0 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow border border-amber-200">
            <Image
              src="/favicon.ico"
              alt="Chienowa Favicon"
              className="h-8 w-8"
              width={32}
              height={32}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold font-sans text-gray-900">
              Chienowa
            </h1>
            <p className="text-xs text-gray-600">知をつなぐ。未来がひらく。</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <DndContext
          id={dndId} // ★ 生成したIDをコンテキストに渡す
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SidebarGroup>
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

            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-2">
                <div
                  key="favorites-menu"
                  onClick={() => onTopicSelect("favorites")}
                  className={`p-3 rounded-xl border cursor-pointer group flex items-center gap-3 ${
                    selectedTopicId === "favorites"
                      ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300"
                      : "bg-white border-amber-200 hover:border-amber-300 hover:shadow-md"
                  }`}
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      selectedTopicId === "favorites"
                        ? "text-yellow-500"
                        : "text-gray-400"
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    お気に入り
                  </h3>
                </div>

                <SortableContext
                  items={topics.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {topics.map((topic) => (
                    <SortableTopicItem key={topic.id} topic={topic}>
                      <div
                        onClick={() => onTopicSelect(topic.id)}
                        className={`relative pl-8 p-3 rounded-xl border cursor-pointer shadow-sm group ${
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
                          {currentUserId === topic.userId && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
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
                                      e.stopPropagation();
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border border-red-200">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      トピックを削除
                                    </AlertDialogTitle>
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
                          )}
                        </div>
                      </div>
                    </SortableTopicItem>
                  ))}
                </SortableContext>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </DndContext>
      </SidebarContent>
    </Sidebar>
  );
};
