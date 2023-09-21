import path from "path";
import { addSuffixToFilePath } from "./fs";
import type { TestInfo } from "@playwright/test";

type Attachment = {
    name: string;
    contentType: string;
    path: string;
};

type AttachmentFileNameArgs = {
    fullTitle: string;
    snapshotName: string;
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

const createImageFileName = ({
    fullTitle,
    snapshotName,
    suffix,
    delimeter = "-",
    ext = "png",
}: AttachmentFileNameArgs): string => {
    return [fullTitle, snapshotName, suffix].filter(Boolean).join(delimeter).replace(/ /g, "-") + "." + ext;
};

const getScreenshotPath = ({ outputDir, fullTitle, snapshotName, suffix }: ScreenshotPathArgs): string =>
    path.join(outputDir, createImageFileName({ fullTitle, snapshotName, suffix }));

export const getScreenshotSnapshotPath = (testInfo: TestInfo, fullTitle: string, snapshotName: string): string =>
    testInfo.snapshotPath(createImageFileName({ fullTitle, snapshotName }));

export const getScreenshotActualPath = (testInfo: TestInfo, fullTitle: string, snapshotName: string): string =>
    getScreenshotPath({ outputDir: testInfo.outputDir, fullTitle, snapshotName, suffix: "actual" });

export const getScreenshotExpectedPath = (testInfo: TestInfo, fullTitle: string, snapshotName: string): string =>
    getScreenshotPath({ outputDir: testInfo.outputDir, fullTitle, snapshotName, suffix: "expected" });

export const getScreenshotDiffPath = (testInfo: TestInfo, fullTitle: string, snapshotName: string): string =>
    getScreenshotPath({ outputDir: testInfo.outputDir, fullTitle, snapshotName, suffix: "diff" });

export default {
    createActualAttachment,
    createExpectedAttachment,
    createDiffAttachment,
    getScreenshotSnapshotPath,
    getScreenshotActualPath,
    getScreenshotExpectedPath,
    getScreenshotDiffPath,
};
