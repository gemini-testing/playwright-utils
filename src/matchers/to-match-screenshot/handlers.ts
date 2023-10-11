import colors from "colors";
import type { TestInfo } from "@playwright/test";
import type { MatcherResult } from "./types";
import type { CoordBounds } from "looks-same";
import fsUtils from "./utils/fs";
import { createActualAttachment, createDiffAttachment, createExpectedAttachment } from "./utils/image";
import { createLogger } from "../../utils/logger";
import type { WeakErrors } from "../../fixtures";
import { UtilsExtendedError } from "../../utils/extended-error";

const logger = createLogger("to-match-screenshot");

type NoRefImageErrorOpts = {
    snapshotName: string;
};

type ImageDiffErrorOpts = {
    snapshotName: string;
    diffClusters?: CoordBounds[];
    isNot?: boolean;
};

type UpdateSnapshotsMode = "none" | "all" | "missing";

type HandleMissingNegatedArgs = {
    updateSnapshots: UpdateSnapshotsMode;
    snapshotPath: string;
};

type HandleMatchingNegatedArgs = {
    snapshotName: string;
    weakErrors: WeakErrors;
    stopOnFirstImageDiff: boolean;
};

type HandleMissingArgs = {
    updateSnapshots: UpdateSnapshotsMode;
    testInfo: TestInfo;
    weakErrors: WeakErrors;
    snapshotName: string;
    snapshotPath: string;
    actualPath: string;
    actualBuffer: Uint8Array;
};

type HandleUpdatingArgs = {
    snapshotPath: string;
    actualPath: string;
    actualBuffer: Uint8Array;
};

type HandleDifferentArgs = {
    testInfo: TestInfo;
    weakErrors: WeakErrors;
    stopOnFirstImageDiff: boolean;
    actualBuffer: Uint8Array;
    expectedBuffer: Uint8Array;
    diffBuffer: Uint8Array;
    snapshotName: string;
    expectedPath: string;
    actualPath: string;
    diffPath: string;
    diffClusters: CoordBounds[];
};

const mkNoRefImageError = (
    message: string,
    { snapshotName }: NoRefImageErrorOpts,
): UtilsExtendedError<NoRefImageErrorOpts> => {
    return new UtilsExtendedError(message, {
        type: "NoRefImageError",
        snapshotName,
    });
};

const mkImageDiffError = (
    message: string,
    { snapshotName, diffClusters, isNot }: ImageDiffErrorOpts,
): UtilsExtendedError<ImageDiffErrorOpts> => {
    return new UtilsExtendedError(message, {
        type: "ImageDiffError",
        snapshotName,
        diffClusters,
        isNot,
    });
};

export const handleMissingNegated = ({ updateSnapshots, snapshotPath }: HandleMissingNegatedArgs): MatcherResult => {
    const isWriteMode = updateSnapshots === "all" || updateSnapshots === "missing";
    const message =
        `A snapshot doesn't exist at ${snapshotPath}` +
        `${isWriteMode ? ', matchers using ".not" won\'t write them automatically.' : "."}`;

    return { pass: true, message: () => message };
};

export const handleDifferentNegated = (): MatcherResult => {
    return { pass: false, message: () => "" };
};

export const handleMatchingNegated = ({
    snapshotName,
    stopOnFirstImageDiff,
    weakErrors,
}: HandleMatchingNegatedArgs): MatcherResult => {
    const message = [
        colors.red("Screenshot comparison failed:"),
        "",
        "  Expected result should be different from the actual one.",
    ].join("\n");

    if (stopOnFirstImageDiff) {
        return { pass: true, message: () => message };
    }

    weakErrors.addError(mkImageDiffError(message, { snapshotName, isNot: true }));

    return { pass: false, message: () => "" };
};

export const handleNotExists = ({ snapshotPath }: { snapshotPath: string }): MatcherResult => {
    return {
        pass: false,
        message: () => `A snapshot doesn't exist at ${snapshotPath}.`,
    };
};

export const handleMissing = async ({
    updateSnapshots,
    testInfo,
    weakErrors,
    snapshotName,
    snapshotPath,
    actualPath,
    actualBuffer,
}: HandleMissingArgs): Promise<MatcherResult> => {
    const isWriteMode = updateSnapshots === "all" || updateSnapshots === "missing";

    if (isWriteMode) {
        await Promise.all([fsUtils.writeFile(snapshotPath, actualBuffer), fsUtils.writeFile(actualPath, actualBuffer)]);

        testInfo.attachments.push(createActualAttachment(snapshotName, actualPath));
    }

    const message = `A snapshot doesn't exist at ${snapshotPath}${isWriteMode ? ", writing actual." : "."}`;

    if (updateSnapshots === "all") {
        logger.log(message);
        return { pass: true, message: () => message };
    }

    if (updateSnapshots === "missing") {
        weakErrors.addError(mkNoRefImageError(message, { snapshotName }));
        return { pass: true, message: () => "" };
    }

    return { pass: false, message: () => message };
};

export const handleUpdating = async ({
    snapshotPath,
    actualPath,
    actualBuffer,
}: HandleUpdatingArgs): Promise<MatcherResult> => {
    await Promise.all([fsUtils.writeFile(snapshotPath, actualBuffer), fsUtils.writeFile(actualPath, actualBuffer)]);

    logger.log(snapshotPath + " is re-generated, writing actual.");
    return {
        pass: true,
        message: () => snapshotPath + " running with --update-snapshots, writing actual.",
    };
};

export const handleDifferent = async ({
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
    diffClusters,
}: HandleDifferentArgs): Promise<MatcherResult> => {
    const writeFilePromises: Promise<void>[] = [];
    const output = [colors.red("Screenshot comparison failed"), ""];

    if (expectedBuffer) {
        writeFilePromises.push(fsUtils.writeFile(expectedPath, expectedBuffer));
        output.push(`Expected: ${colors.yellow(expectedPath)}`);
        testInfo.attachments.push(createExpectedAttachment(snapshotName, expectedPath));
    }

    if (actualBuffer) {
        writeFilePromises.push(fsUtils.writeFile(actualPath, actualBuffer));
        output.push(`Received: ${colors.yellow(actualPath)}`);
        testInfo.attachments.push(createActualAttachment(snapshotName, actualPath));
    }

    if (diffBuffer) {
        writeFilePromises.push(fsUtils.writeFile(diffPath, diffBuffer));
        output.push(`    Diff: ${colors.yellow(diffPath)}`);
        testInfo.attachments.push(createDiffAttachment(snapshotName, diffPath));
    }

    await Promise.all(writeFilePromises);

    if (stopOnFirstImageDiff) {
        return { pass: false, message: () => output.join("\n") };
    }

    weakErrors.addError(mkImageDiffError(output.join("\n"), { snapshotName, diffClusters }));

    return { pass: true, message: () => "" };
};

export const handleMatching = (): MatcherResult => {
    return { pass: true, message: () => "" };
};

export default {
    handleMissingNegated,
    handleDifferentNegated,
    handleMatchingNegated,
    handleNotExists,
    handleMissing,
    handleUpdating,
    handleDifferent,
    handleMatching,
};
