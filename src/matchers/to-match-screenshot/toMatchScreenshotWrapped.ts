import looksSame from "looks-same";
import type { TestInfo } from "@playwright/test";
import type { ExpectThis, MatcherResult } from "./types";
import type { WeakErrors } from "../../fixtures";
import handlers from "./handlers";
import fsUtils from "./utils/fs";
import { CompareOpts } from "./options";
import {
    getScreenshotSnapshotPath,
    getScreenshotActualPath,
    getScreenshotExpectedPath,
    getScreenshotDiffPath,
} from "./utils/image";

type ToMatchScreenshotWrappedArgs = {
    actualBuffer: Buffer;
    snapshotName: string;
    compareOpts: CompareOpts;
    testInfo: TestInfo;
    weakErrors: WeakErrors;
};

const areSame = (
    { equal, differentPixels, totalPixels }: { equal: boolean; differentPixels: number; totalPixels: number },
    maxDiffPixels: number,
    maxDiffPixelRatio: number,
): boolean => equal || differentPixels < maxDiffPixels || differentPixels / totalPixels < maxDiffPixelRatio;

export async function toMatchScreenshotWrapped(
    this: ExpectThis,
    { actualBuffer, snapshotName, compareOpts, testInfo, weakErrors }: ToMatchScreenshotWrappedArgs,
): Promise<MatcherResult> {
    const isUpdateSnapshotsMissing = testInfo.config.updateSnapshots === "missing";
    const willBeRetried = testInfo.retry < testInfo.project.retries;
    const updateSnapshots = isUpdateSnapshotsMissing && willBeRetried ? "none" : testInfo.config.updateSnapshots;

    const snapshotPath = getScreenshotSnapshotPath(testInfo, snapshotName);
    const actualPath = getScreenshotActualPath(testInfo, snapshotName);
    const expectedPath = getScreenshotExpectedPath(testInfo, snapshotName);
    const diffPath = getScreenshotDiffPath(testInfo, snapshotName);

    const { maxDiffPixels, maxDiffPixelRatio, stopOnFirstImageDiff, ...looksSameOpts } = compareOpts;

    const hasSnapshot = await fsUtils.exists(snapshotPath);

    if (this.isNot) {
        if (!hasSnapshot) {
            return handlers.handleMissingNegated({ updateSnapshots, snapshotPath });
        }

        const looksSameResult = await looksSame(actualBuffer, snapshotPath, looksSameOpts);

        return areSame(looksSameResult, maxDiffPixels, maxDiffPixelRatio)
            ? handlers.handleMatchingNegated({ weakErrors, stopOnFirstImageDiff })
            : handlers.handleDifferentNegated();
    }

    if (updateSnapshots === "none" && !hasSnapshot) {
        return handlers.handleNotExists({ snapshotPath });
    }

    if (!hasSnapshot) {
        return handlers.handleMissing({
            updateSnapshots,
            testInfo,
            weakErrors,
            snapshotName,
            snapshotPath,
            actualPath,
            actualBuffer,
        });
    }

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
        weakErrors,
        stopOnFirstImageDiff,
        actualBuffer,
        expectedBuffer,
        diffBuffer,
        snapshotName,
        expectedPath,
        actualPath,
        diffPath,
    });
}
