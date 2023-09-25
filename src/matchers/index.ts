import type { Expect, Fixtures } from "@playwright/test";
import { createToMatchScreenshotFixture } from "./to-match-screenshot";
import type { PageLike, LocatorLike, ExpectLike } from "./types";
import type { ToMatchScreenshotMatcher, ToMatchScreenshotOptions } from "./to-match-screenshot";

export type MatchersFixture = ToMatchScreenshotOptions;

export const createMatchersFixture = (expect: ExpectLike): Fixtures<MatchersFixture> => ({
    ...createToMatchScreenshotFixture(expect as Expect),
});

interface PageOrLocatorMatchers<R> {
    toMatchScreenshot: ToMatchScreenshotMatcher<R>;
}

type PageOrLocatorMatchersResolved<R, T> = {
    [K in keyof PageOrLocatorMatchers<R>]: T extends PageLike | LocatorLike ? PageOrLocatorMatchers<R>[K] : never;
};

type CustomMatchers<R, T> = PageOrLocatorMatchersResolved<R, T>;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace PlaywrightTest {
        // eslint-disable-next-line
        interface Matchers<R, T> extends CustomMatchers<R, T> {}
    }
}
