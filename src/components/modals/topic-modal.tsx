"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { FileText, Loader2 } from "lucide-react"; // ★ Loader2をインポート
import React from "react";

/**
 * TopicModalコンポーネントのプロパティ
 */
interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTopic: TopicWithBookmarkCount | null;
  topicForm: {
    emoji: string;
    title: string;
    description: string;
  };
  setTopicForm: React.Dispatch<
    React.SetStateAction<{
      emoji: string;
      title: string;
      description: string;
    }>
  >;
  onSubmit: () => void;
  isSubmitting: boolean; // ★ isSubmitting を受け取る
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  editingTopic,
  topicForm,
  setTopicForm,
  onSubmit,
  isSubmitting, // ★ isSubmitting を受け取る
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border border-amber-200 max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-amber-100 pb-4 bg-gradient-to-r from-amber-50 to-orange-50 -m-6 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingTopic ? "トピック編集" : "新しいトピック作成"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-6 p-1">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                絵文字
              </label>
              <Input
                value={topicForm.emoji}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, emoji: e.target.value })
                }
                className="border-amber-200 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-center text-xl"
                placeholder="📁"
                maxLength={2}
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                タイトル
              </label>
              <Input
                value={topicForm.title}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, title: e.target.value })
                }
                className="border-amber-200 focus:ring-amber-500 focus:border-amber-500 rounded-xl"
                placeholder="トピックタイトルを入力"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              説明・メモ
            </label>
            <Textarea
              value={topicForm.description}
              onChange={(e) =>
                setTopicForm({ ...topicForm, description: e.target.value })
              }
              rows={12}
              className="border-amber-200 focus:ring-amber-500 focus:border-amber-500 rounded-xl font-mono text-sm resize-none"
              placeholder={`トピックの説明やメモを入力...`}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500 font-medium">
                {topicForm.description.length} 文字
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {topicForm.description.split("\n").length} 行
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-amber-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          {/* ★★★ ボタンを修正 ★★★ */}
          <Button
            onClick={onSubmit}
            disabled={!topicForm.title.trim() || isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm min-w-[6rem] flex justify-center items-center"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editingTopic ? (
              "更新"
            ) : (
              "作成"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
