import type { Expect, Fixtures, Locator } from "@playwright/test";
import { createToMatchScreenshotFixture } from "./to-match-screenshot";
import type { ToMatchScreenshotMatcher, ToMatchScreenshotOptions } from "./to-match-screenshot";

type ExpectLike = { [K in keyof Expect]: unknown };
type LocatorLike = { [K in keyof Locator]: unknown };

export const createMatchersCombinedFixture = (expect: ExpectLike): Fixtures => ({
    ...createToMatchScreenshotFixture(expect as Expect),
});

export type PlaywrightUtilsOptions = ToMatchScreenshotOptions;

interface LocatorMatchers<R> {
    toMatchScreenshot: ToMatchScreenshotMatcher<R>;
}

type LocatorMatchersResolved<R, T> = {
    [K in keyof LocatorMatchers<R>]: T extends LocatorLike ? LocatorMatchers<R>[K] : never;
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace PlaywrightTest {
        // eslint-disable-next-line
        interface Matchers<R, T> extends LocatorMatchersResolved<R, T> {}
    }
}
