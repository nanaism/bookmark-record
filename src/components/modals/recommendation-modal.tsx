"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { extractDomain } from "@/lib/utils/url";
import { Globe, Loader2, Plus, Sparkles } from "lucide-react";
import Image from "next/image";

export interface RecommendationResult {
  id: string;
  url: string;
  title: string;
  ogImage?: string;
  ogDescription?: string;
}

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string | null;
  recommendations: RecommendationResult[];
  isLoading: boolean;
  onAddBookmark: (recommendation: RecommendationResult) => void;
  addingBookmarkId: string | null;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  sourceUrl,
  recommendations,
  isLoading,
  onAddBookmark,
  addingBookmarkId,
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
              こちらのサイトはいかがですか？✨️
            </DialogTitle>
          </div>
          <p
            className="text-sm text-gray-600 truncate pt-2 max-w-full"
            title={sourceUrl ?? ""}
            style={{ maxWidth: 320, display: "block" }}
          >
            元記事: {sourceUrl}
          </p>
        </DialogHeader>

        <div className="mt-6 min-h-[240px] max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-2">
                  <Skeleton className="h-24 w-32 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-gray-200" />
                    <Skeleton className="h-4 w-1/2 bg-gray-200" />
                    <Skeleton className="h-8 w-20 rounded-lg bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <Card
                    key={rec.id}
                    className="flex overflow-hidden transition-all hover:shadow-md border border-transparent hover:border-blue-100"
                  >
                    <div className="w-1/3">
                      <AspectRatio ratio={4 / 3}>
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-full w-full"
                        >
                          {rec.ogImage ? (
                            <Image
                              src={rec.ogImage}
                              alt={rec.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <Globe className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </a>
                      </AspectRatio>
                    </div>

                    {/* ★★★ このブロック全体を修正 ★★★ */}
                    <div className="flex w-2/3 flex-col p-4">
                      {/* 上部コンテンツ */}
                      <div className="flex-grow">
                        <CardHeader className="p-0">
                          <CardTitle className="text-base font-semibold text-blue-800 hover:underline">
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {rec.title}
                            </a>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="mt-2 p-0 text-xs text-gray-500">
                          {extractDomain(rec.url)}
                        </CardContent>
                      </div>

                      {/* 下部コンテンツ（ボタン） */}
                      <div className="mt-2 flex shrink-0 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => onAddBookmark(rec)}
                          disabled={!!addingBookmarkId}
                        >
                          {addingBookmarkId === rec.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          追加
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex-1 pt-16 text-center text-gray-500">
                  関連する情報が見つかりませんでした。
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
