import type { Expect, Locator, Page } from "@playwright/test";

export type ExpectLike = { [K in keyof Expect]: unknown };
export type PageLike = { [K in keyof Page]: unknown };
export type LocatorLike = { [K in keyof Locator]: unknown };
