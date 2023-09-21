import type { Locator, TestInfo } from "@playwright/test";
import { toMatchScreenshotWrapped } from "./toMatchScreenshotWrapped";
import { defaultOptions, getOptions, type Options } from "./options";
import type { MatcherResult, ExpectThis } from "./types";

type ToMatchScreenshot = (
    this: ExpectThis,
    locator: Locator,
    snapshotName: string,
    userOptions?: Partial<Options>,
) => Promise<MatcherResult>;

export const createToMatchScreenshot = (
    test: { info: () => TestInfo },
    projectOptions?: Partial<Options>,
): ToMatchScreenshot => {
    return function toMatchScreenshot(locator, snapshotName, userOptions) {
        if (typeof snapshotName !== "string") {
            return Promise.resolve({ pass: false, message: () => "A snapshot name is required" });
        }

        const options = getOptions(userOptions, projectOptions, defaultOptions);

        return toMatchScreenshotWrapped.call(this, locator, snapshotName, options, test);
    };
};

export type ToMatchScreenshotMatcher<R> = (snapshotName: string, options?: Partial<Options>) => Promise<R>;
