import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:3000";

async function isServerReachable(url: string) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status > 0;
  } catch {
    return false;
  }
}

test.describe("Tools API execution contract", () => {
  test("returns safe error envelope on unauthenticated request", async ({ request }) => {
    test.skip(!(await isServerReachable(API_BASE_URL)), `Server not reachable at ${API_BASE_URL}`);

    const response = await request.post(`${API_BASE_URL}/api/tools`, {
      data: {
        toolId: "seo-article-generator",
        input: { topic: "test" },
      },
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json).toHaveProperty("success", false);
    expect(String(json.error ?? "").toLowerCase()).toContain("unauthorized");
  });
});
