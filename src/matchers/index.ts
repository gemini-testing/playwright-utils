import type { Locator } from "@playwright/test";
import type { ToMatchScreenshotMatcher } from "./to-match-screenshot";

export * from "./to-match-screenshot";

// eslint-disable-next-line @typescript-eslint/ban-types
type LocatorLike = { [K in keyof Locator]: Function };

interface LocatorMatchers<R> {
    toMatchScreenshot: ToMatchScreenshotMatcher<R>;
}

type LocatorMatchersResolved<R, T> = {
    [K in keyof LocatorMatchers<R>]: T extends LocatorLike ? LocatorMatchers<R>[K] : never;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CustomMatchers<R, T> extends LocatorMatchersResolved<R, T> {}

type CustomAssertionName = keyof CustomMatchers<void, void>;

export type PwtUtilsMatchers<R, T, K extends CustomAssertionName> = Pick<CustomMatchers<R, T>, K>;
