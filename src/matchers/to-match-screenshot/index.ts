import type { Expect, Fixtures, Locator, Page, TestFixture } from "@playwright/test";
import { toMatchScreenshotWrapped } from "./toMatchScreenshotWrapped";
import { defaultOptions, getOptions, type Options } from "./options";
import { weakErrorsFixture, type WeakErrorOptions } from "../../fixtures";

export type ToMatchScreenshotOptions = { toMatchScreenshot: Partial<Options> };

type ToMatchScreenshotFixture = TestFixture<void, ToMatchScreenshotOptions & WeakErrorOptions>;

export const createToMatchScreenshotFixture = (expect: Expect): Fixtures<ToMatchScreenshotFixture> => ({
    ...weakErrorsFixture,
    toMatchScreenshot: [{}, { scope: "test", option: true }],
    toMatchScreenshotMatcher: [
        async function ({ toMatchScreenshot: projectOptions, weakErrors }, use, testInfo): Promise<void> {
            expect.extend({
                async toMatchScreenshot(target: Page | Locator, snapshotName: string, userOptions?: Partial<Options>) {
                    if (typeof snapshotName !== "string") {
                        return Promise.resolve({ pass: false, message: () => "A snapshot name is required" });
                    }

                    const { screenshotOpts, compareOpts } = getOptions(userOptions, projectOptions, defaultOptions);
                    const actualBuffer = await target.screenshot(screenshotOpts);

                    return toMatchScreenshotWrapped.call(this, {
                        actualBuffer,
                        snapshotName,
                        compareOpts,
                        testInfo,
                        weakErrors,
                    });
                },
            });

            await use();
        } as ToMatchScreenshotFixture,
        { scope: "test", auto: true },
    ],
});

export type ToMatchScreenshotMatcher<R> = (snapshotName: string, options?: Partial<Options>) => Promise<R>;
