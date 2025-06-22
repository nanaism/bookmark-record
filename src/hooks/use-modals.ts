import { useEffect, useState } from "react";

/**
 * モーダル表示状態を管理するカスタムフック
 *
 * アプリケーション内の複数のモーダル（トピック、ブックマーク、一括追加）と
 * 説明文の展開状態を一元管理します。
 */
export const useModals = (selectedTopicId: string) => {
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // トピック変更時に説明文の展開状態をリセット
  // 異なるトピックの説明文が展開されたままになることを防ぐ
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [selectedTopicId]);

  const openTopicModal = () => {
    setShowTopicModal(true);
  };

  const closeTopicModal = () => {
    setShowTopicModal(false);
  };

  const openBookmarkModal = () => {
    setShowBookmarkModal(true);
  };

  const closeBookmarkModal = () => {
    setShowBookmarkModal(false);
  };

  const openBulkModal = () => {
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
  };

  const toggleDescriptionExpansion = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const openRecommendationModal = () => setShowRecommendationModal(true);
  const closeRecommendationModal = () => setShowRecommendationModal(false);

  return {
    // モーダル表示状態
    showTopicModal,
    showBookmarkModal,
    showBulkModal,
    showRecommendationModal,
    isDescriptionExpanded,

    // モーダル操作関数
    openTopicModal,
    closeTopicModal,
    openBookmarkModal,
    closeBookmarkModal,
    openBulkModal,
    closeBulkModal,
    openRecommendationModal,
    closeRecommendationModal,
    toggleDescriptionExpansion,

    // 直接的なセッター（既存のDialogコンポーネントとの互換性のため）
    setShowTopicModal,
    setShowBookmarkModal,
    setShowBulkModal,
    setShowRecommendationModal,
  };
};
