"use client";

// dnd-kit から必要なものをインポート
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 既存のコンポーネントと型をインポート
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { extractDomain, getFaviconUrl } from "@/lib/utils/url";
import { Bookmark as BookmarkType } from "@prisma/client";
import {
  Bookmark,
  Edit,
  ExternalLink,
  Folder,
  Globe,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import React from "react";

// Propsのインターフェース
interface BookmarkGridProps {
  bookmarks: BookmarkType[];
  selectedTopic: TopicWithBookmarkCount | undefined;
  isLoading: boolean;
  onBookmarkEdit: (bookmark: BookmarkType) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onBookmarkFavoriteToggle: (bookmarkId: string) => void;
  onBookmarkCreate: () => void;
  showBookmarkModal: boolean;
  setShowBookmarkModal: (show: boolean) => void;
  togglingFavoriteId: string | null;
  onFetchRecommendations: (bookmark: BookmarkType) => void;
  onOrderChange: (activeId: string, overId: string) => void;
  currentUserId?: string | null;
}

// ブックマークカードをdnd-kitでラップするコンポーネント
const SortableBookmarkCard: React.FC<{
  bookmark: BookmarkType;
  children: React.ReactNode;
}> = ({ bookmark, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  selectedTopic,
  isLoading,
  onBookmarkEdit,
  onBookmarkDelete,
  onBookmarkFavoriteToggle,
  onBookmarkCreate,
  showBookmarkModal,
  setShowBookmarkModal,
  togglingFavoriteId,
  onFetchRecommendations,
  onOrderChange,
  currentUserId,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onOrderChange(active.id as string, over.id as string);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col border border-amber-100 rounded-2xl p-4 gap-4 bg-white"
          >
            <Skeleton className="aspect-[1.91/1] w-full rounded-xl bg-amber-100" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3 bg-amber-100" />
              <Skeleton className="h-5 w-full bg-amber-100" />
              <Skeleton className="h-5 w-4/5 bg-amber-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (selectedTopic === undefined && bookmarks.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          お気に入りのブックマークはありません
        </h3>
        <p className="text-gray-600">
          ブックマークの星アイコンをクリックして、お気に入りに追加しましょう。
        </p>
      </div>
    );
  }

  if (!selectedTopic && bookmarks.length > 0) {
    // This case covers when "Favorites" is selected and has items.
    // We proceed to render the grid.
  } else if (!selectedTopic) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <Folder className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          トピックを選択
        </h3>
        <p className="text-gray-600">
          サイドバーからトピックを選択して、ブックマークを表示・管理してください。
        </p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          まだブックマークがありません
        </h3>
        <p className="text-gray-600 mb-6">
          このトピックに最初のブックマークを追加してください
        </p>
        <Dialog open={showBookmarkModal} onOpenChange={setShowBookmarkModal}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
              onClick={onBookmarkCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              ブックマーク追加
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={bookmarks.map((b) => b.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.map((bookmark) => (
            <SortableBookmarkCard key={bookmark.id} bookmark={bookmark}>
              <Card className="group relative flex flex-col hover:shadow-lg transition-all border-amber-200 hover:border-amber-300 rounded-2xl bg-white">
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-all flex items-center justify-center"
                    onClick={() => onBookmarkFavoriteToggle(bookmark.id)}
                    disabled={!!togglingFavoriteId}
                  >
                    {togglingFavoriteId === bookmark.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <Star
                        className={`h-4 w-4 transition-all ${
                          bookmark.isFavorite
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-400 group-hover:text-yellow-400"
                        }`}
                      />
                    )}
                  </Button>
                </div>
                <div className="w-full">
                  <AspectRatio
                    ratio={1.91 / 1}
                    className="bg-amber-50 rounded-t-2xl relative"
                  >
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full"
                    >
                      {bookmark.ogImage ? (
                        <Image
                          src={bookmark.ogImage}
                          alt={
                            bookmark.ogTitle || "ブックマークのプレビュー画像"
                          }
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover rounded-t-2xl"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Globe className="w-10 h-10 text-amber-300" />
                        </div>
                      )}
                    </a>
                  </AspectRatio>
                </div>
                <div className="flex flex-col flex-1 p-4">
                  <CardHeader className="p-0 mb-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getFaviconUrl(bookmark.url)!}
                        alt=""
                        width={16}
                        height={16}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <CardTitle className="text-sm font-normal text-gray-500">
                        {extractDomain(bookmark.url)}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <h3 className="font-semibold text-base text-gray-800 leading-snug mb-2 hover:text-amber-700">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {bookmark.ogTitle || bookmark.url}
                      </a>
                    </h3>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {bookmark.description}
                    </CardDescription>
                  </CardContent>

                  {/* ★★★ このブロック全体を修正 ★★★ */}
                  <CardFooter className="p-0 mt-4 flex justify-between items-center">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:underline flex items-center gap-1"
                    >
                      サイトへ移動 <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* AIボタンは常に表示 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => onFetchRecommendations(bookmark)}
                        title="関連コンテンツを探す"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>

                      {/* 編集・削除ボタンは本人にのみ表示 */}
                      {currentUserId === bookmark.authorId && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-amber-50"
                            onClick={() => onBookmarkEdit(bookmark)}
                            title="編集する"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="削除する"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border border-red-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ブックマークを削除
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  このブックマークを削除してもよろしいですか？
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">
                                  キャンセル
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onBookmarkDelete(bookmark.id)}
                                  className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </CardFooter>
                </div>
              </Card>
            </SortableBookmarkCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
