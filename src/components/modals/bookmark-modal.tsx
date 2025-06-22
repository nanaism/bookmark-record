"use client";

/**
 * ブックマーク作成・編集モーダルコンポーネント
 *
 * ブックマークの新規作成と既存ブックマークの編集機能を提供します。
 * トピック選択、URL入力、説明文入力のフォームを含み、
 * URL形式の検証機能も備えています。
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { isValidUrl } from "@/lib/utils/url";
import { Bookmark as BookmarkType } from "@prisma/client";
import { AlertCircle, Bookmark, Check } from "lucide-react";
import React from "react";

/**
 * BookmarkModalコンポーネントのプロパティ
 */
interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBookmark: BookmarkType | null;
  topics: TopicWithBookmarkCount[];
  bookmarkForm: {
    topicId: string;
    url: string;
    description: string;
  };
  setBookmarkForm: React.Dispatch<
    React.SetStateAction<{
      topicId: string;
      url: string;
      description: string;
    }>
  >;
  onSubmit: () => void;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  editingBookmark,
  topics,
  bookmarkForm,
  setBookmarkForm,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border border-amber-200">
        {/* モーダルヘッダー */}
        <DialogHeader className="border-b border-amber-100 pb-4 bg-gradient-to-r from-amber-50 to-orange-50 -m-6 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingBookmark ? "ブックマーク編集" : "新しいブックマーク追加"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* フォーム入力エリア */}
        <div className="space-y-4 mt-6">
          {/* トピック選択 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              トピック
            </label>
            <Select
              value={bookmarkForm.topicId}
              onValueChange={(value) =>
                setBookmarkForm({ ...bookmarkForm, topicId: value })
              }
            >
              <SelectTrigger className="border-amber-200 focus:ring-amber-500 rounded-xl">
                <SelectValue placeholder="トピックを選択" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL入力（バリデーション付き） */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              URL
            </label>
            <div className="relative">
              <Input
                type="url"
                value={bookmarkForm.url}
                onChange={(e) =>
                  setBookmarkForm({ ...bookmarkForm, url: e.target.value })
                }
                className={`border rounded-xl focus:ring-amber-500 ${
                  bookmarkForm.url && !isValidUrl(bookmarkForm.url)
                    ? "border-red-300"
                    : "border-amber-200 focus:border-amber-500"
                }`}
                placeholder="https://example.com"
              />
              {/* URL形式の検証結果を表示するアイコン */}
              {bookmarkForm.url && (
                <div className="absolute right-3 top-3">
                  {isValidUrl(bookmarkForm.url) ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 説明文入力 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              説明
            </label>
            <Textarea
              value={bookmarkForm.description}
              onChange={(e) =>
                setBookmarkForm({
                  ...bookmarkForm,
                  description: e.target.value,
                })
              }
              rows={3}
              className="border-amber-200 focus:ring-amber-500 focus:border-amber-500 rounded-xl resize-none"
              placeholder="ブックマークの説明を入力"
            />
          </div>
        </div>

        {/* フッターボタン */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-amber-100">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!bookmarkForm.url.trim() || !isValidUrl(bookmarkForm.url)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
          >
            {editingBookmark ? "更新" : "追加"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
