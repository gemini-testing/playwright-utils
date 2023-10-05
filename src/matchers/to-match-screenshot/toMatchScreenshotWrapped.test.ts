import { when } from "jest-when";
import type { Locator, TestInfo } from "@playwright/test";
import type { PreparedOptions } from "./options";
import type { MatcherResult } from "./types";
import type { WeakErrors } from "../../fixtures";
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
        stopOnImageDiff?: boolean;
        testInfo?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
) => Promise<MatcherResult> | MatcherResult;

describe("toMatchScreenshotWrapped", () => {
    let locator: Locator, weakErrors: WeakErrors, defaultTestInfo: TestInfo;
    let toMatchScreenshotWrapped_: ToMatchScreenshotWrapped_;

    beforeEach(() => {
        locator = { screenshot: jest.fn().mockResolvedValue("actual-buffer") } as unknown as Locator;
        weakErrors = { addError: jest.fn() } as unknown as WeakErrors;
        defaultTestInfo = {
            titlePath: ["fileName", "suite", "testName"],
            project: { retries: 0 },
            config: { updateSnapshots: "none" },
            outputDir: "output-dir",
        } as unknown as TestInfo;
        toMatchScreenshotWrapped_ = (
            locator: Locator,
            snapshotName = "snapshot",
            { isNot = false, stopOnImageDiff = true, testInfo = {} } = { isNot: false, testInfo: {} },
        ): Promise<MatcherResult> | MatcherResult => {
            return toMatchScreenshotWrapped.call(
                { isNot },
                {
                    target: locator,
                    snapshotName,
                    opts: { compareOpts: { stopOnImageDiff } } as PreparedOptions,
                    testInfo: { ...defaultTestInfo, ...testInfo },
                    weakErrors,
                },
            );
        };
    });

    it("should handle missing negated", async () => {
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

    it("should handle matching negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: true } as unknown as ReturnType<typeof looksSame>);

        await toMatchScreenshotWrapped_(locator, "snapshot", { isNot: true });

        expect(handlers.handleMatchingNegated).toBeCalledWith({ weakErrors, stopOnImageDiff: true });
    });

    it("should handle different negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: false } as unknown as ReturnType<typeof looksSame>);

        await toMatchScreenshotWrapped_(locator, "snapshot", { isNot: true });

        expect(handlers.handleDifferentNegated).toBeCalled();
    });

    it("should handle no snapshot and updateSnapshots is 'none'", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(false);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snap-path");

        await toMatchScreenshotWrapped_(locator, "snapshot", {
            testInfo: {
                config: { updateSnapshots: "none" },
            },
        });

        expect(handlers.handleNotExists).toBeCalled();
    });

    it("should handle no snapshot and updateSnapshots is not 'none'", async () => {
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
            weakErrors: expect.anything(),
            snapshotName: "snapshot",
            snapshotPath: "snapshot-path",
            actualPath: "actual-path",
            actualBuffer: "actual-buffer",
        });
    });

    it("should handle matching", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: true } as unknown as ReturnType<typeof looksSame>);

        await toMatchScreenshotWrapped_(locator, "snapshot");

        expect(handlers.handleMatching).toBeCalled();
    });

    it("should handle updating snapshots", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: false } as unknown as ReturnType<typeof looksSame>);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snapshot-path");
        jest.mocked(imageUtils.getScreenshotActualPath).mockReturnValue("actual-path");

        await toMatchScreenshotWrapped_(locator, "snapshot", {
            testInfo: {
                config: { updateSnapshots: "all" },
            },
        });

        expect(handlers.handleUpdating).toBeCalled();
    });

    it("should handle different screenshots", async () => {
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
        } as unknown as ReturnType<typeof looksSame>);
        const testInfo = {
            config: { updateSnapshots: "none" },
        };

        await toMatchScreenshotWrapped_(locator, "snapshot", { testInfo });

        expect(handlers.handleDifferent).toBeCalledWith({
            testInfo: expect.objectContaining(testInfo),
            weakErrors,
            stopOnImageDiff: true,
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
