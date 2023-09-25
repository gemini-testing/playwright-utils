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

const createImageFileName = ({
    snapshotName,
    fullTitle,
    suffix,
    delimeter = "-",
    ext = "png",
}: AttachmentFileNameArgs): string => {
    const fileName = [fullTitle, snapshotName, suffix].filter(Boolean).join(delimeter).replace(/ /g, "-");

    return fileName.endsWith("." + ext) ? fileName : fileName + "." + ext;
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
