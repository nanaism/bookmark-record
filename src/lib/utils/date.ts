import { differenceInDays, format, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 日付を相対的または絶対的な形式でフォーマットする
 *
 * 30日以内の日付は「今日」「昨日」「○日前」「○週間前」の相対表示、
 * それ以降は「yyyy/MM/dd」の絶対表示を行う。
 * ユーザーにとって直感的で読みやすい日付表示を提供する。
 */
export const formatDate = (date: Date) => {
  const now = new Date();
  const daysDiff = differenceInDays(now, date);

  // 30日以内は相対表示（ユーザーにとって直感的）
  if (daysDiff <= 30) {
    if (isToday(date)) return "今日";
    if (isYesterday(date)) return "昨日";
    if (daysDiff < 7) return `${daysDiff}日前`;
    return `${Math.floor(daysDiff / 7)}週間前`;
  }

  // 30日を超えたら絶対表示（正確な日付が重要）
  return format(date, "yyyy/MM/dd", { locale: ja });
};
