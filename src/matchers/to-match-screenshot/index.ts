import type { Expect, Fixtures, Locator, TestFixture, TestInfo } from "@playwright/test";
import { toMatchScreenshotWrapped } from "./toMatchScreenshotWrapped";
import { defaultOptions, getOptions, type Options } from "./options";
import type { MatcherResult, ExpectThis } from "./types";

type ToMatchScreenshot = (
    this: ExpectThis,
    locator: Locator,
    snapshotName: string,
    userOptions?: Partial<Options>,
) => Promise<MatcherResult>;

export const createToMatchScreenshot = (testInfo: TestInfo, projectOptions?: Partial<Options>): ToMatchScreenshot => {
    return function toMatchScreenshot(locator, snapshotName, userOptions) {
        if (typeof snapshotName !== "string") {
            return Promise.resolve({ pass: false, message: () => "A snapshot name is required" });
        }

        const options = getOptions(userOptions, projectOptions, defaultOptions);

        return toMatchScreenshotWrapped.call(this, locator, snapshotName, options, testInfo);
    };
};

export type ToMatchScreenshotOptions = { toMatchScreenshotOptions?: Partial<Options> };

type ToMatchScreenshotFixture = TestFixture<void, ToMatchScreenshotOptions>;

export const createToMatchScreenshotFixture = (expect: Expect): Fixtures<ToMatchScreenshotFixture> => ({
    toMatchScreenshotOptions: [{}, { scope: "test", option: true }],
    toMatchScreenshot: [
        async function ({ toMatchScreenshotOptions }, use, testInfo): Promise<void> {
            console.log(toMatchScreenshotOptions);
            const toMatchScreenshot = createToMatchScreenshot(testInfo, toMatchScreenshotOptions);

            expect.extend({ toMatchScreenshot });

            await use();
        } as ToMatchScreenshotFixture,
        { scope: "test", auto: true },
    ],
});

export type ToMatchScreenshotMatcher<R> = (snapshotName: string, options?: Partial<Options>) => Promise<R>;
