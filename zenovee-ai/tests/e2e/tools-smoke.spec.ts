import { expect, test } from "@playwright/test";

test.describe("Public tools directory", () => {
  test("loads tools page with search/filter UI", async ({ page }) => {
    await page.goto("/tools");
    await expect(page).toHaveURL(/\/tools/);
    await expect(page.getByPlaceholder(/search premium tools/i)).toBeVisible();
    await expect(page.getByText(/featured|trending/i).first()).toBeVisible();
  });

  test("opens a public tool detail route", async ({ page }) => {
    await page.goto("/tools");
    const firstToolLink = page.locator('a[href^="/tools/"]').first();
    await expect(firstToolLink).toBeVisible();
    const href = await firstToolLink.getAttribute("href");
    expect(href).toBeTruthy();
    if (!href) return;
    await page.goto(href);
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("search, category filter and pagination work", async ({ page }) => {
    await page.goto("/tools");

    await page.getByPlaceholder(/search premium tools/i).fill("seo");
    await expect(page.getByText(/showing\s+\d+\s+of\s+\d+\s+tools/i)).toBeVisible();

    const categoryButton = page.getByRole("button", { name: /seo/i }).first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await expect(page.getByRole("heading", { name: /all premium tools/i })).toBeVisible();
    }

    const nextButton = page.getByRole("button", { name: /^next$/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(page.getByText(/page\s+2\s*\//i)).toBeVisible();
    }
  });
});

test.describe("Mobile responsiveness", () => {
  test("tools page is usable on mobile viewport", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByPlaceholder(/search premium tools/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /all premium tools/i })).toBeVisible();
    await expect(page.locator('a[href^="/tools/"]').first()).toBeVisible();
  });
});
