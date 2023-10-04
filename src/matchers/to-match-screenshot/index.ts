import type { Expect, Fixtures, Locator, Page, TestFixture, TestInfo } from "@playwright/test";
import { toMatchScreenshotWrapped } from "./toMatchScreenshotWrapped";
import { defaultOptions, getOptions, type Options } from "./options";
import type { MatcherResult, ExpectThis } from "./types";
import { weakErrorsFixture, type WeakErrors, type WeakErrorOptions } from "../../fixtures";

type CreateToMatchScreenshotArgs = {
    testInfo: TestInfo;
    weakErrors: WeakErrors;
    projectOptions?: Partial<Options>;
};

type ToMatchScreenshot = (
    this: ExpectThis,
    target: Page | Locator,
    snapshotName: string,
    userOptions?: Partial<Options>,
) => Promise<MatcherResult>;

export const createToMatchScreenshot = ({
    testInfo,
    weakErrors,
    projectOptions,
}: CreateToMatchScreenshotArgs): ToMatchScreenshot => {
    return function toMatchScreenshot(target, snapshotName, userOptions) {
        if (typeof snapshotName !== "string") {
            return Promise.resolve({ pass: false, message: () => "A snapshot name is required" });
        }

        const opts = getOptions(userOptions, projectOptions, defaultOptions);

        return toMatchScreenshotWrapped.call(this, {
            target,
            snapshotName,
            opts,
            testInfo,
            weakErrors,
        });
    };
};

export type ToMatchScreenshotOptions = { toMatchScreenshot: Partial<Options> };

type ToMatchScreenshotFixture = TestFixture<void, ToMatchScreenshotOptions & WeakErrorOptions>;

export const createToMatchScreenshotFixture = (expect: Expect): Fixtures<ToMatchScreenshotFixture> => ({
    ...weakErrorsFixture,
    toMatchScreenshot: [{}, { scope: "test", option: true }],
    toMatchScreenshotMatcher: [
        async function ({ toMatchScreenshot: projectOptions, weakErrors }, use, testInfo): Promise<void> {
            const toMatchScreenshot = createToMatchScreenshot({ testInfo, weakErrors, projectOptions });

            expect.extend({ toMatchScreenshot });

            await use();
        } as ToMatchScreenshotFixture,
        { scope: "test", auto: true },
    ],
});

export type ToMatchScreenshotMatcher<R> = (snapshotName: string, options?: Partial<Options>) => Promise<R>;
