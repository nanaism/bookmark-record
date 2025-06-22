"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";

// Exa APIのレスポンスの型定義
export interface RecommendationResult {
  title: string;
  url: string;
  id: string;
}

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string | null;
  recommendations: RecommendationResult[];
  isLoading: boolean;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  sourceUrl,
  recommendations,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border border-blue-200 max-w-2xl">
        <DialogHeader className="border-b border-blue-100 pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 -m-6 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              関連する新しい発見
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 truncate pt-2">
            元記事: {sourceUrl}
          </p>
        </DialogHeader>

        <div className="mt-6 min-h-[200px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  Exa APIが新しい情報を探しています...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <a
                    key={rec.id}
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <h3 className="font-semibold text-blue-800 mb-1">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {rec.url} <ExternalLink className="w-3 h-3" />
                    </p>
                  </a>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  関連する情報が見つかりませんでした。
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-blue-100">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
