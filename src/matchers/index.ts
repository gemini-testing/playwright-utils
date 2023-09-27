import type { Expect, Fixtures, Locator, Page } from "@playwright/test";
import { createToMatchScreenshotFixture } from "./to-match-screenshot";
import type { ToMatchScreenshotMatcher, ToMatchScreenshotOptions } from "./to-match-screenshot";

type ExpectLike = { [K in keyof Expect]: unknown };
type PageLike = { [K in keyof Page]: unknown };
type LocatorLike = { [K in keyof Locator]: unknown };

export const createMatchersCombinedFixture = (expect: ExpectLike): Fixtures => ({
    ...createToMatchScreenshotFixture(expect as Expect),
});

export type PlaywrightUtilsOptions = ToMatchScreenshotOptions;

interface LocatorMatchers<R> {
    toMatchScreenshot: ToMatchScreenshotMatcher<R>;
}

interface PageOrLocatorMatchers<R> {
    toMatchScreenshot: ToMatchScreenshotMatcher<R>;
}

type PageOrLocatorMatchersResolved<R, T> = {
    [K in keyof LocatorMatchers<R>]: T extends PageLike | LocatorLike ? PageOrLocatorMatchers<R>[K] : never;
};

type CustomMatchers<R, T> = PageOrLocatorMatchersResolved<R, T>;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace PlaywrightTest {
        // eslint-disable-next-line
        interface Matchers<R, T> extends CustomMatchers<R, T> {}
    }
}
