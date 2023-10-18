import path from "path";
import { addSuffixToFilePath } from "./fs";
import type { TestInfo } from "@playwright/test";

type Attachment = {
    name: string;
    contentType: string;
    path: string;
};

type AttachmentFileNameArgs = {
    snapshotName: string;
    fullTitle?: string;
    suffix?: string;
    delimeter?: string;
    ext?: string;
};

type ScreenshotPathArgs = {
    outputDir: string;
    fullTitle: string;
    snapshotName: string;
    suffix: string;
};

const createAttachment = (name: string, filePath: string): Attachment => ({
    name,
    contentType: "image/png",
    path: filePath,
});

export const createActualAttachment = (snapshotName: string, actualPath: string): Attachment =>
    createAttachment(addSuffixToFilePath(snapshotName, "actual"), actualPath);

export const createExpectedAttachment = (snapshotName: string, expectedPath: string): Attachment =>
    createAttachment(addSuffixToFilePath(snapshotName, "expected"), expectedPath);

export const createDiffAttachment = (snapshotName: string, diffPath: string): Attachment =>
    createAttachment(addSuffixToFilePath(snapshotName, "diff"), diffPath);

// Replacing the same characters that playwright does
const sanitizeForFilePath = (str: string): string =>
    str.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, "-"); // eslint-disable-line no-control-regex

const createImageFileName = ({
    snapshotName,
    fullTitle,
    suffix,
    delimeter = "-",
    ext = ".png",
}: AttachmentFileNameArgs): string => {
    const snapshotExt = path.extname(snapshotName) || ext;
    const extLength = snapshotExt.length;
    const snapshotBase = snapshotName.endsWith(snapshotExt) ? snapshotName.slice(0, -extLength) : snapshotName;

    const fileBase = [fullTitle, snapshotBase, suffix].filter(Boolean).join(delimeter);
    const sanitizedFileBase = sanitizeForFilePath(fileBase);

    return sanitizedFileBase + snapshotExt;
};

const getScreenshotPath = ({ outputDir, fullTitle, snapshotName, suffix }: ScreenshotPathArgs): string =>
    path.join(outputDir, createImageFileName({ fullTitle, snapshotName, suffix }));

const getTestFullTitle = (testInfo: TestInfo): string => testInfo.titlePath.slice(1).join(" ");

export const getScreenshotSnapshotPath = (testInfo: TestInfo, snapshotName: string): string =>
    testInfo.snapshotPath(createImageFileName({ snapshotName }));

export const getScreenshotActualPath = (testInfo: TestInfo, snapshotName: string): string =>
    getScreenshotPath({
        outputDir: testInfo.outputDir,
        fullTitle: getTestFullTitle(testInfo),
        snapshotName,
        suffix: "actual",
    });

export const getScreenshotExpectedPath = (testInfo: TestInfo, snapshotName: string): string =>
    getScreenshotPath({
        outputDir: testInfo.outputDir,
        fullTitle: getTestFullTitle(testInfo),
        snapshotName,
        suffix: "expected",
    });

export const getScreenshotDiffPath = (testInfo: TestInfo, snapshotName: string): string =>
    getScreenshotPath({
        outputDir: testInfo.outputDir,
        fullTitle: getTestFullTitle(testInfo),
        snapshotName,
        suffix: "diff",
    });

export default {
    createActualAttachment,
    createExpectedAttachment,
    createDiffAttachment,
    getScreenshotSnapshotPath,
    getScreenshotActualPath,
    getScreenshotExpectedPath,
    getScreenshotDiffPath,
};
