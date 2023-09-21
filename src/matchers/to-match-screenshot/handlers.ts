import colors from "colors";
import type { TestInfo } from "@playwright/test";
import type { MatcherResult } from "./types";
import fsUtils from "./utils/fs";
import { createActualAttachment, createDiffAttachment, createExpectedAttachment } from "./utils/image";

type UpdateSnapshotsMode = "none" | "all" | "missing";

type HandleMissingNegatedArgs = {
    updateSnapshots: UpdateSnapshotsMode;
    snapshotPath: string;
};

type HandleMissingArgs = {
    updateSnapshots: UpdateSnapshotsMode;
    testInfo: TestInfo;
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
    actualBuffer: Uint8Array;
    expectedBuffer: Uint8Array;
    diffBuffer: Uint8Array;
    snapshotName: string;
    expectedPath: string;
    actualPath: string;
    diffPath: string;
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

export const handleMatchingNegated = (): MatcherResult => {
    const message = [
        colors.red("Screenshot comparison failed:"),
        "",
        "  Expected result should be different from the actual one.",
    ].join("\n");

    return { pass: true, message: () => message };
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

    if (isWriteMode) {
        console.log(message);
        return { pass: true, message: () => message };
    }

    return { pass: false, message: () => message };
};

export const handleUpdating = async ({
    snapshotPath,
    actualPath,
    actualBuffer,
}: HandleUpdatingArgs): Promise<MatcherResult> => {
    await Promise.all([fsUtils.writeFile(snapshotPath, actualBuffer), fsUtils.writeFile(actualPath, actualBuffer)]);

    console.log(snapshotPath + " is re-generated, writing actual.");
    return {
        pass: true,
        message: () => snapshotPath + " running with --update-snapshots, writing actual.",
    };
};

export const handleDifferent = async ({
    testInfo,
    actualBuffer,
    expectedBuffer,
    diffBuffer,
    snapshotName,
    expectedPath,
    actualPath,
    diffPath,
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

    return { pass: false, message: () => output.join("\n") };
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
