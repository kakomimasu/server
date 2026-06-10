import { deleteCookie, getCookie, setCookie } from "@hono/hono/cookie";
import type { CookiePrefixOptions } from "@hono/hono/utils/cookie";
import type { Context } from "@hono/hono";
import * as arctic from "arctic";
import { prisma } from "../../core/kv.ts";
import { env } from "../../core/env.ts";

const OAUTH_COOKIE_NAME = "oauth-session";
const SITE_COOKIE_NAME = "site-session";
const COOKIE_PATH = "/";
// 90 days in seconds
const SITE_SESSION_MAX_AGE = 7776000;
// 10 minutes in seconds
const OAUTH_SESSION_MAX_AGE = 600;

function isHttps(url: string): boolean {
  return url.startsWith("https://");
}

function cookiePrefix(url: string): CookiePrefixOptions | undefined {
  return isHttps(url) ? "host" : undefined;
}

function getSuccessUrl(request: Request): string {
  const url = new URL(request.url);
  const successUrl = url.searchParams.get("success_url");
  if (successUrl !== null) return successUrl;
  const referrer = request.headers.get("referer");
  if (referrer !== null && new URL(referrer).origin === url.origin) {
    return referrer;
  }
  return "/";
}

function getGitHub(): arctic.GitHub {
  return new arctic.GitHub(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
    null,
  );
}

/**
 * GitHub OAuth authorization URL を生成し、OAuthセッションをDBに保存してリダイレクトレスポンスを返す
 */
export async function signIn(ctx: Context): Promise<Response> {
  const request = ctx.req.raw;
  const github = getGitHub();
  const state = arctic.generateState();
  const scopes = ["read:user"];
  const authorizationUrl = github.createAuthorizationURL(state, scopes);
  const successUrl = getSuccessUrl(request);

  const oauthSessionId = crypto.randomUUID();

  // OAuthセッションをDBに保存
  await prisma.oAuthSession.create({
    data: {
      id: oauthSessionId,
      state,
      successUrl,
      expiresAt: new Date(Date.now() + OAUTH_SESSION_MAX_AGE * 1000),
    },
  });

  const prefix = cookiePrefix(request.url);

  const response = new Response(null, {
    status: 302,
    headers: { location: authorizationUrl.toString() },
  });

  setCookie(ctx, OAUTH_COOKIE_NAME, oauthSessionId, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: isHttps(request.url),
    sameSite: "Lax",
    maxAge: OAUTH_SESSION_MAX_AGE,
    prefix,
  });

  // Hono の setCookie はctxのヘッダに設定するので、レスポンスヘッダにコピー
  for (const value of ctx.res.headers.getSetCookie()) {
    response.headers.append("set-cookie", value);
  }

  return response;
}

/**
 * OAuth callbackを処理し、arcticでアクセストークンを取得してセッションを作成する
 */
export async function handleCallback(
  ctx: Context,
): Promise<{ response: Response; accessToken: string; sessionId: string }> {
  const request = ctx.req.raw;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    throw new Error("Missing code or state parameter");
  }

  const prefix = cookiePrefix(request.url);
  const oauthSessionId = getCookie(ctx, OAUTH_COOKIE_NAME, prefix);

  if (!oauthSessionId) {
    throw new Error("OAuth cookie not found");
  }

  // OAuthセッションをDBから取得して削除
  const oauthSession = await prisma.oAuthSession.findUnique({
    where: { id: oauthSessionId },
  });

  if (!oauthSession) {
    throw new Error("OAuth session not found");
  }

  // 削除（使い捨て）
  await prisma.oAuthSession.delete({ where: { id: oauthSessionId } });

  // 期限切れチェック
  if (oauthSession.expiresAt < new Date()) {
    throw new Error("OAuth session expired");
  }

  // stateの検証
  if (oauthSession.state !== state) {
    throw new Error("OAuth state mismatch");
  }

  // arcticでGitHubからアクセストークンを取得
  const github = getGitHub();
  const tokens = await github.validateAuthorizationCode(code);
  const accessToken = tokens.accessToken();

  // セッションIDを生成してDBに保存
  const sessionId = crypto.randomUUID();
  await prisma.siteSession.create({
    data: {
      id: sessionId,
      expiresAt: new Date(Date.now() + SITE_SESSION_MAX_AGE * 1000),
    },
  });

  const response = new Response(null, {
    status: 302,
    headers: { location: oauthSession.successUrl },
  });

  setCookie(ctx, SITE_COOKIE_NAME, sessionId, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: isHttps(request.url),
    sameSite: "Lax",
    maxAge: SITE_SESSION_MAX_AGE,
    prefix,
  });

  return { response, accessToken, sessionId };
}

/**
 * リクエストのCookieからセッションIDを取得し、DBで有効性を確認する
 */
export async function getSessionId(
  ctx: Context,
): Promise<string | undefined> {
  const prefix = cookiePrefix(ctx.req.url);
  const sessionId = getCookie(ctx, SITE_COOKIE_NAME, prefix);
  if (!sessionId) return undefined;

  // DBでセッションの有効性を確認
  const session = await prisma.siteSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.expiresAt < new Date()) {
    // 期限切れセッションは削除
    if (session) {
      await prisma.siteSession.delete({ where: { id: sessionId } });
    }
    return undefined;
  }

  return sessionId;
}

/**
 * サインアウト処理：セッションをDBから削除し、Cookieをクリアする
 */
export async function signOut(ctx: Context): Promise<Response> {
  const request = ctx.req.raw;
  const successUrl = getSuccessUrl(request);
  const response = new Response(null, {
    status: 302,
    headers: { location: successUrl },
  });

  const prefix = cookiePrefix(request.url);

  // CookieからセッションIDを取得してDBから削除
  const sessionId = getCookie(ctx, SITE_COOKIE_NAME, prefix);
  if (sessionId) {
    await prisma.siteSession.delete({ where: { id: sessionId } }).catch(
      () => {},
    );
  }

  // Cookieを削除
  deleteCookie(ctx, SITE_COOKIE_NAME, { path: COOKIE_PATH, prefix });

  return response;
}
