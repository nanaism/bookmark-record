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
import { Skeleton } from "@/components/ui/skeleton"; // ★ Skeletonをインポート
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { extractDomain, getFaviconUrl } from "@/lib/utils/url";
import { Bookmark as BookmarkType } from "@prisma/client";
import {
  Bookmark,
  Edit,
  ExternalLink,
  Folder,
  Globe,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import React from "react";

interface BookmarkGridProps {
  bookmarks: BookmarkType[];
  selectedTopic: TopicWithBookmarkCount | undefined;
  isLoading: boolean;
  onBookmarkEdit: (bookmark: BookmarkType) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onBookmarkCreate: () => void;
  showBookmarkModal: boolean;
  setShowBookmarkModal: (show: boolean) => void;
  onBookmarkFavoriteToggle: (bookmarkId: string) => void; // ★ propsを追加
}

export const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  selectedTopic,
  isLoading,
  onBookmarkEdit,
  onBookmarkDelete,
  onBookmarkCreate,
  showBookmarkModal,
  setShowBookmarkModal,
  onBookmarkFavoriteToggle, // ★ propsを受け取る
}) => {
  // ★★★ isLoading時の処理をスケルトンに置き換える ★★★
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* スケルトンカードを8つ表示する例 */}
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

  if (!selectedTopic) {
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

  // ★★★ 「お気に入り」選択時用の表示を追加 ★★★
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bookmarks.map((bookmark) => (
        <Card
          key={bookmark.id}
          className="group relative flex flex-col hover:shadow-lg transition-all border-amber-200 hover:border-amber-300 rounded-2xl bg-white"
        >
          {/* ▼▼▼ 星アイコンを右上に絶対配置 ▼▼▼ */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-all"
              onClick={() => onBookmarkFavoriteToggle(bookmark.id)}
            >
              <Star
                className={`h-4 w-4 transition-all ${
                  bookmark.isFavorite
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-400 group-hover:text-yellow-400"
                }`}
              />
            </Button>
          </div>
          {/* ▲▲▲ ここまで追加 ▲▲▲ */}
          <div className="w-full">
            <AspectRatio ratio={1.91 / 1} className="bg-amber-50 rounded-t-2xl">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                {bookmark.ogImage ? (
                  <Image
                    src={bookmark.ogImage}
                    alt={bookmark.ogTitle || "ブックマークのプレビュー画像"}
                    fill
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

            <CardFooter className="p-0 mt-4 flex justify-between items-center">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 hover:underline flex items-center gap-1"
              >
                サイトへ移動 <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-amber-50"
                  onClick={() => onBookmarkEdit(bookmark)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border border-red-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle>ブックマークを削除</AlertDialogTitle>
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
              </div>
            </CardFooter>
          </div>
        </Card>
      ))}
    </div>
  );
};
