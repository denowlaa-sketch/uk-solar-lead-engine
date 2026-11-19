import { getFacebookPageAccessToken } from "./env";

export type InstagramLinkStatus = {
  connected: boolean;
  username: string | null;
  pageName: string | null;
  error: string | null;
};

type GraphPage = {
  name?: string;
  instagram_business_account?: { id?: string; username?: string; name?: string };
  connected_instagram_account?: { id?: string; username?: string };
  error?: { message?: string };
};

export async function getLinkedInstagram(): Promise<InstagramLinkStatus> {
  const token = getFacebookPageAccessToken();
  if (!token) {
    return { connected: false, username: null, pageName: null, error: "Page token missing" };
  }

  const url = new URL("https://graph.facebook.com/v21.0/me");
  url.searchParams.set(
    "fields",
    "id,name,instagram_business_account{id,username,name},connected_instagram_account{id,username}"
  );
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as GraphPage;
    if (!res.ok || data.error) {
      const message = data.error?.message ?? "Could not read Instagram from Meta";
      const expired = /expired|session has expired|code":190/i.test(JSON.stringify(data.error ?? message));
      return {
        connected: false,
        username: null,
        pageName: null,
        error: expired
          ? "Page access token expired. Generate a new Page token, paste it into .env as FACEBOOK_PAGE_ACCESS_TOKEN, restart the app, then refresh."
          : message,
      };
    }

    const username =
      data.instagram_business_account?.username ??
      data.connected_instagram_account?.username ??
      null;

    return {
      connected: Boolean(username),
      username: username ? `@${username.replace(/^@/, "")}` : null,
      pageName: data.name ?? null,
      error: username ? null : "Page is not linked to an Instagram professional account in Graph yet.",
    };
  } catch (error) {
    return {
      connected: false,
      username: null,
      pageName: null,
      error: error instanceof Error ? error.message : "Instagram lookup failed",
    };
  }
}
