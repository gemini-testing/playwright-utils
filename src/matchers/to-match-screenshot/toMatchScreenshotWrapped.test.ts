import { when } from "jest-when";
import type { Locator, TestInfo } from "@playwright/test";
import type { PreparedOptions } from "./options";
import type { MatcherResult } from "./types";
import { toMatchScreenshotWrapped } from "./toMatchScreenshotWrapped";

import looksSame from "looks-same";
import imageUtils from "./utils/image";
import fsUtils from "./utils/fs";
import handlers from "./handlers";

jest.mock("looks-same");
jest.mock("./utils/image");
jest.mock("./utils/fs");
jest.mock("./handlers");

type ToMatchScreenshotWrapped_ = (
    locator: Locator,
    snapshotName: string,
    opts?: {
        isNot?: boolean;
        testInfo?: Record<string, any>;
    },
) => Promise<MatcherResult> | MatcherResult;

describe("toMatchScreenshotWrapped", () => {
    let locator: Locator, defaultTestInfo: TestInfo, toMatchScreenshotWrapped_: ToMatchScreenshotWrapped_;

    beforeEach(() => {
        locator = { screenshot: jest.fn().mockResolvedValue("actual-buffer") } as unknown as Locator;
        defaultTestInfo = {
            titlePath: ["fileName", "suite", "testName"],
            project: { retries: 0 },
            config: { updateSnapshots: "none" },
            outputDir: "output-dir",
        } as unknown as TestInfo;
        toMatchScreenshotWrapped_ = (
            locator: Locator,
            snapshotName = "snapshot",
            { isNot = false, testInfo = {} } = { isNot: false, testInfo: {} },
        ): Promise<MatcherResult> | MatcherResult => {
            return toMatchScreenshotWrapped.call(
                { isNot },
                locator,
                snapshotName,
                { compareOpts: {} } as PreparedOptions,
                { ...defaultTestInfo, ...testInfo },
            );
        };
    });

    it("missing negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(false);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snap-path");

        await toMatchScreenshotWrapped_(locator, "snapshot-not-exists", {
            isNot: true,
            testInfo: {
                config: { updateSnapshots: "none" },
            },
        });

        expect(handlers.handleMissingNegated).toBeCalledWith({ updateSnapshots: "none", snapshotPath: "snap-path" });
        expect(locator.screenshot).not.toBeCalled();
    });

    it("matching negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: true } as any);

        await toMatchScreenshotWrapped_(locator, "snapshot", { isNot: true });

        expect(handlers.handleMatchingNegated).toBeCalled();
    });

    it("different negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: false } as any);

        await toMatchScreenshotWrapped_(locator, "snapshot", { isNot: true });

        expect(handlers.handleDifferentNegated).toBeCalled();
    });

    it("no snapshot and updateSnapshots is 'none'", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(false);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snap-path");

        await toMatchScreenshotWrapped_(locator, "snapshot", {
            testInfo: {
                config: { updateSnapshots: "none" },
            },
        });

        expect(handlers.handleNotExists).toBeCalled();
    });

    it("no snapshot and updateSnapshots is not 'none'", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(false);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snapshot-path");
        jest.mocked(imageUtils.getScreenshotActualPath).mockReturnValue("actual-path");
        const testInfo = {
            config: { updateSnapshots: "missing" },
        };

        await toMatchScreenshotWrapped_(locator, "snapshot", { testInfo });

        expect(handlers.handleMissing).toBeCalledWith({
            updateSnapshots: "missing",
            testInfo: expect.objectContaining(testInfo),
            snapshotName: "snapshot",
            snapshotPath: "snapshot-path",
            actualPath: "actual-path",
            actualBuffer: "actual-buffer",
        });
    });

    it("matching", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: true } as any);

        await toMatchScreenshotWrapped_(locator, "snapshot");

        expect(handlers.handleMatching).toBeCalled();
    });

    it("updating snapshots", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: false } as any);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snapshot-path");
        jest.mocked(imageUtils.getScreenshotActualPath).mockReturnValue("actual-path");

        await toMatchScreenshotWrapped_(locator, "snapshot", {
            testInfo: {
                config: { updateSnapshots: "all" },
            },
        });

        expect(handlers.handleUpdating).toBeCalled();
    });

    it("different", async () => {
        when(fsUtils.readFile).calledWith("snapshot-path").mockResolvedValue("expected-buffer");
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snapshot-path");
        jest.mocked(imageUtils.getScreenshotExpectedPath).mockReturnValue("expected-path");
        jest.mocked(imageUtils.getScreenshotActualPath).mockReturnValue("actual-path");
        jest.mocked(imageUtils.getScreenshotDiffPath).mockReturnValue("diff-path");
        jest.mocked(looksSame).mockResolvedValue({
            equal: false,
            diffImage: {
                createBuffer: () => Promise.resolve("diff-buffer"),
            },
        } as any);
        const testInfo = {
            config: { updateSnapshots: "none" },
        };

        await toMatchScreenshotWrapped_(locator, "snapshot", { testInfo });

        expect(handlers.handleDifferent).toBeCalledWith({
            testInfo: expect.objectContaining(testInfo),
            actualBuffer: "actual-buffer",
            expectedBuffer: "expected-buffer",
            diffBuffer: "diff-buffer",
            snapshotName: "snapshot",
            expectedPath: "expected-path",
            actualPath: "actual-path",
            diffPath: "diff-path",
        });
    });
});
