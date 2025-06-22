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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicWithBookmarkCount } from "@/hooks/use-topics";
import { extractDomain } from "@/lib/utils/url";
import { Globe, Loader2, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
  onAddBookmark: (
    recommendation: RecommendationResult,
    topicId: string
  ) => void;
  addingBookmarkId: string | null;
  userTopics: TopicWithBookmarkCount[];
  onTopicCreate: (rec: RecommendationResult) => void;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  sourceUrl,
  recommendations,
  isLoading,
  onAddBookmark,
  addingBookmarkId,
  userTopics,
  onTopicCreate,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const handleOpenChange = () => {
    setSelectedTopicId(null);
  };

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
          <p className="text-sm text-gray-600 truncate pt-2">
            元記事: {sourceUrl}
          </p>
        </DialogHeader>

        <div className="mt-6 min-h-[240px] max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-4">
              {" "}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-2">
                  {" "}
                  <Skeleton className="h-24 w-32 rounded-lg bg-gray-200" />{" "}
                  <div className="flex-1 space-y-2">
                    {" "}
                    <Skeleton className="h-4 w-3/4 bg-gray-200" />{" "}
                    <Skeleton className="h-4 w-1/2 bg-gray-200" />{" "}
                    <Skeleton className="h-8 w-20 rounded-lg bg-gray-200" />{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <Card key={rec.id} className="flex overflow-hidden">
                    <div className="w-1/3">
                      <AspectRatio ratio={4 / 3} className="relative">
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
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              {" "}
                              <Globe className="w-8 h-8 text-gray-400" />{" "}
                            </div>
                          )}
                        </a>
                      </AspectRatio>
                    </div>
                    <div className="flex w-2/3 flex-col p-4">
                      <div className="flex-grow">
                        <CardHeader className="p-0">
                          <CardTitle className="text-base font-semibold text-blue-800 hover:underline">
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {" "}
                              {rec.title}{" "}
                            </a>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="mt-2 p-0 text-xs text-gray-500">
                          {" "}
                          {extractDomain(rec.url)}{" "}
                        </CardContent>
                      </div>
                      <div className="mt-2 flex shrink-0 justify-end">
                        <Popover onOpenChange={handleOpenChange}>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              className="rounded-lg"
                              disabled={!!addingBookmarkId}
                            >
                              {addingBookmarkId === rec.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 mr-2" />
                              )}
                              追加
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-4">
                            <div className="space-y-4">
                              {userTopics.length > 0 ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-800 mb-2">
                                    {" "}
                                    追加先のトピックを選択{" "}
                                  </p>
                                  <Select onValueChange={setSelectedTopicId}>
                                    <SelectTrigger>
                                      {" "}
                                      <SelectValue placeholder="あなたのトピック..." />{" "}
                                    </SelectTrigger>
                                    <SelectContent>
                                      {userTopics.map((topic) => (
                                        <SelectItem
                                          key={topic.id}
                                          value={topic.id}
                                        >
                                          {" "}
                                          {topic.emoji} {topic.title}{" "}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    disabled={!selectedTopicId}
                                    onClick={() => {
                                      if (selectedTopicId) {
                                        onAddBookmark(rec, selectedTopicId);
                                      }
                                    }}
                                  >
                                    {" "}
                                    確定{" "}
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm font-medium text-gray-800 mb-2">
                                    {" "}
                                    最初の一歩！{" "}
                                  </p>
                                  <p className="text-xs text-gray-500 mb-3">
                                    {" "}
                                    このブックマークを追加するために、最初のトピックを作成しましょう。{" "}
                                  </p>
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => onTopicCreate(rec)}
                                  >
                                    {" "}
                                    <Plus className="w-4 h-4 mr-2" />{" "}
                                    新しいトピックを作成{" "}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex-1 pt-16 text-center text-gray-500">
                  {" "}
                  関連する情報が見つかりませんでした。{" "}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
