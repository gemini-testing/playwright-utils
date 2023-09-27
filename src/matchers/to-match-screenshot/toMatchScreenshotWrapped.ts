import looksSame from "looks-same";
import type { Locator, TestInfo } from "@playwright/test";
import type { ExpectThis, MatcherResult } from "./types";
import handlers from "./handlers";
import fsUtils from "./utils/fs";
import { PreparedOptions } from "./options";
import {
    getScreenshotSnapshotPath,
    getScreenshotActualPath,
    getScreenshotExpectedPath,
    getScreenshotDiffPath,
} from "./utils/image";

const areSame = (
    { equal, differentPixels, totalPixels }: { equal: boolean; differentPixels: number; totalPixels: number },
    maxDiffPixels: number,
    maxDiffPixelRatio: number,
): boolean => equal || differentPixels < maxDiffPixels || differentPixels / totalPixels < maxDiffPixelRatio;

export async function toMatchScreenshotWrapped(
    this: ExpectThis,
    locator: Locator,
    snapshotName: string,
    opts: PreparedOptions,
    test: { info: () => TestInfo },
): Promise<MatcherResult> {
    const testInfo = test.info();
    const isUpdateSnapshotsMissing = testInfo.config.updateSnapshots === "missing";
    const willBeRetried = testInfo.retry < testInfo.project.retries;
    const updateSnapshots = isUpdateSnapshotsMissing && willBeRetried ? "none" : testInfo.config.updateSnapshots;

    const snapshotPath = getScreenshotSnapshotPath(testInfo, snapshotName);
    const actualPath = getScreenshotActualPath(testInfo, snapshotName);
    const expectedPath = getScreenshotExpectedPath(testInfo, snapshotName);
    const diffPath = getScreenshotDiffPath(testInfo, snapshotName);

    const { screenshotOpts, compareOpts } = opts;
    const { maxDiffPixels, maxDiffPixelRatio, ...looksSameOpts } = compareOpts;
    const hasSnapshot = await fsUtils.exists(snapshotPath);

    if (this.isNot) {
        if (!hasSnapshot) {
            return handlers.handleMissingNegated({ updateSnapshots, snapshotPath });
        }

        const actual = await locator.screenshot(screenshotOpts);
        const looksSameResult = await looksSame(actual, snapshotPath, looksSameOpts);

        return areSame(looksSameResult, maxDiffPixels, maxDiffPixelRatio)
            ? handlers.handleMatchingNegated()
            : handlers.handleDifferentNegated();
    }

    if (updateSnapshots === "none" && !hasSnapshot) {
        return handlers.handleNotExists({ snapshotPath });
    }

    if (!hasSnapshot) {
        const actualBuffer = await locator.screenshot(screenshotOpts);

        return handlers.handleMissing({
            updateSnapshots,
            testInfo,
            snapshotName,
            snapshotPath,
            actualPath,
            actualBuffer,
        });
    }

    const actualBuffer = await locator.screenshot(screenshotOpts);
    const expectedBuffer = await fsUtils.readFile(snapshotPath);
    const looksSameResult = await looksSame(actualBuffer, expectedBuffer, compareOpts);

    if (areSame(looksSameResult, maxDiffPixels, maxDiffPixelRatio)) {
        return handlers.handleMatching();
    }

    if (updateSnapshots === "all") {
        return handlers.handleUpdating({ snapshotPath, actualPath, actualBuffer });
    }

    const diffBuffer = await looksSameResult.diffImage!.createBuffer("png");

    return handlers.handleDifferent({
        testInfo,
        actualBuffer,
        expectedBuffer,
        diffBuffer,
        snapshotName,
        expectedPath,
        actualPath,
        diffPath,
    });
}
