export { auth as middleware } from "./auth"; // or "./auth"

// オプション: このmatcherを使うと、指定したパス以外にはミドルウェアが適用されなくなります。
// 画像やAPIルートなどを除外することで、不要な処理を防ぎます。
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
