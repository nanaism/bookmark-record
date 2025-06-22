"use client";

/**
 * ブックマーク一括追加モーダルコンポーネント
 *
 * 複数のURLを一度に追加する機能を提供します。
 * テキストエリアに改行区切りでURLを入力し、
 * 有効なURLのみを抽出してブックマークとして登録します。
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { getValidUrls } from "@/lib/utils/url";
import { Upload } from "lucide-react";
import React from "react";

/**
 * BulkAddModalコンポーネントのプロパティ
 */
interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicWithBookmarkCount[];
  bulkForm: {
    topicId: string;
    urls: string;
  };
  setBulkForm: React.Dispatch<
    React.SetStateAction<{
      topicId: string;
      urls: string;
    }>
  >;
  onSubmit: () => void;
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({
  isOpen,
  onClose,
  topics,
  bulkForm,
  setBulkForm,
  onSubmit,
}) => {
  // 入力されたテキストから有効なURLを抽出
  const validUrls = getValidUrls(bulkForm.urls);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border border-amber-200 max-w-lg">
        {/* モーダルヘッダー */}
        <DialogHeader className="border-b border-amber-100 pb-4 bg-gradient-to-r from-amber-50 to-orange-50 -m-6 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              ブックマーク一括追加
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
              value={bulkForm.topicId}
              onValueChange={(value) =>
                setBulkForm({ ...bulkForm, topicId: value })
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

          {/* URL一括入力 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              URLs
            </label>
            <Textarea
              value={bulkForm.urls}
              onChange={(e) =>
                setBulkForm({ ...bulkForm, urls: e.target.value })
              }
              rows={8}
              className="border-amber-200 focus:ring-amber-500 focus:border-amber-500 rounded-xl resize-none font-mono text-sm"
              placeholder={`複数のURLを1行ずつ貼り付け：
 
https://example.com
https://another-site.com
https://third-site.org`}
            />
            {/* 入力状況の表示 */}
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500 font-medium">
                複数のURLを1行ずつ貼り付けてください
              </p>
              <p className="text-xs font-semibold text-amber-600">
                {validUrls.length} 個の有効なURLを検出
              </p>
            </div>
          </div>

          {/* 有効なURLのプレビュー表示 */}
          {bulkForm.urls && validUrls.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                プレビュー:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {/* 最初の5つのURLを表示 */}
                {validUrls.slice(0, 5).map((url, index) => (
                  <p
                    key={index}
                    className="text-xs text-gray-600 truncate bg-white px-2 py-1 rounded-lg"
                  >
                    {url}
                  </p>
                ))}
                {/* 5つ以上ある場合は残り数を表示 */}
                {validUrls.length > 5 && (
                  <p className="text-xs text-amber-600 font-medium">
                    他 {validUrls.length - 5} 個のURL
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* フッターボタン */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-amber-100">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            onClick={onSubmit}
            disabled={validUrls.length === 0}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-80 text-white rounded-xl shadow-sm"
          >
            {validUrls.length} 個のブックマークを追加
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
