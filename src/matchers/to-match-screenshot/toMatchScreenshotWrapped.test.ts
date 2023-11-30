import { when } from "jest-when";
import type { TestInfo } from "@playwright/test";
import type { CompareOpts } from "./options";
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
    actualBuffer: Buffer,
    snapshotName: string,
    opts?: {
        isNot?: boolean;
        stopOnFirstImageDiff?: boolean;
        saveImageOnScreenshotMatch?: boolean;
        testInfo?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
) => Promise<MatcherResult> | MatcherResult;

describe("toMatchScreenshotWrapped", () => {
    let actualBuffer: Buffer, weakErrors: WeakErrors, defaultTestInfo: TestInfo;
    let toMatchScreenshotWrapped_: ToMatchScreenshotWrapped_;

    beforeEach(() => {
        actualBuffer = Buffer.from("actual-buffer");
        weakErrors = { addError: jest.fn() } as unknown as WeakErrors;
        defaultTestInfo = {
            titlePath: ["fileName", "suite", "testName"],
            project: { retries: 0 },
            config: { updateSnapshots: "none" },
            outputDir: "output-dir",
        } as unknown as TestInfo;
        toMatchScreenshotWrapped_ = (
            actualBuffer: Buffer,
            snapshotName = "snapshot",
            { isNot = false, stopOnFirstImageDiff = false, saveImageOnScreenshotMatch = true, testInfo = {} } = {
                isNot: false,
                testInfo: {},
            },
        ): Promise<MatcherResult> | MatcherResult => {
            return toMatchScreenshotWrapped.call(
                { isNot },
                {
                    actualBuffer,
                    snapshotName,
                    compareOpts: { stopOnFirstImageDiff, saveImageOnScreenshotMatch } as CompareOpts,
                    testInfo: { ...defaultTestInfo, ...testInfo },
                    weakErrors,
                },
            );
        };
    });

    it("should handle missing negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(false);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snap-path");

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot-not-exists", {
            isNot: true,
            testInfo: {
                config: { updateSnapshots: "none" },
            },
        });

        expect(handlers.handleMissingNegated).toBeCalledWith({ updateSnapshots: "none", snapshotPath: "snap-path" });
    });

    it("should handle matching negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: true } as unknown as ReturnType<typeof looksSame>);

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", { isNot: true });

        expect(handlers.handleMatchingNegated).toBeCalledWith({
            snapshotName: "snapshot",
            weakErrors,
            stopOnFirstImageDiff: false,
        });
    });

    it("should handle different negated", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: false } as unknown as ReturnType<typeof looksSame>);

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", { isNot: true });

        expect(handlers.handleDifferentNegated).toBeCalled();
    });

    it("should handle no snapshot and updateSnapshots is 'none'", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(false);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snap-path");

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", {
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

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", { testInfo });

        expect(handlers.handleMissing).toBeCalledWith({
            updateSnapshots: "missing",
            testInfo: expect.objectContaining(testInfo),
            weakErrors: expect.anything(),
            snapshotName: "snapshot",
            snapshotPath: "snapshot-path",
            actualPath: "actual-path",
            actualBuffer: Buffer.from("actual-buffer"),
        });
    });

    it("should handle matching", async () => {
        when(fsUtils.readFile).calledWith("snapshot-path").mockResolvedValue(Buffer.from("expected-buffer"));
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: true } as unknown as ReturnType<typeof looksSame>);
        jest.mocked(imageUtils.getScreenshotExpectedPath).mockReturnValue("expected-path");

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", {
            saveImageOnScreenshotMatch: false,
        });

        expect(handlers.handleMatching).toBeCalledWith({
            testInfo: defaultTestInfo,
            saveImageOnScreenshotMatch: false,
            expectedBuffer: Buffer.from("expected-buffer"),
            snapshotName: "snapshot",
            expectedPath: "expected-path",
        });
    });

    it("should handle updating snapshots", async () => {
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(looksSame).mockResolvedValue({ equal: false } as unknown as ReturnType<typeof looksSame>);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snapshot-path");
        jest.mocked(imageUtils.getScreenshotActualPath).mockReturnValue("actual-path");

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", {
            testInfo: {
                config: { updateSnapshots: "all" },
            },
        });

        expect(handlers.handleUpdating).toBeCalled();
    });

    it("should handle different screenshots", async () => {
        when(fsUtils.readFile).calledWith("snapshot-path").mockResolvedValue(Buffer.from("expected-buffer"));
        jest.mocked(fsUtils.exists).mockResolvedValueOnce(true);
        jest.mocked(imageUtils.getScreenshotSnapshotPath).mockReturnValue("snapshot-path");
        jest.mocked(imageUtils.getScreenshotExpectedPath).mockReturnValue("expected-path");
        jest.mocked(imageUtils.getScreenshotActualPath).mockReturnValue("actual-path");
        jest.mocked(imageUtils.getScreenshotDiffPath).mockReturnValue("diff-path");
        jest.mocked(looksSame).mockResolvedValue({
            equal: false,
            diffImage: {
                createBuffer: () => Promise.resolve(Buffer.from("diff-buffer")),
            },
        } as unknown as ReturnType<typeof looksSame>);
        const testInfo = {
            config: { updateSnapshots: "none" },
        };

        await toMatchScreenshotWrapped_(actualBuffer, "snapshot", { testInfo });

        expect(handlers.handleDifferent).toBeCalledWith({
            testInfo: expect.objectContaining(testInfo),
            weakErrors,
            stopOnFirstImageDiff: false,
            actualBuffer: Buffer.from("actual-buffer"),
            expectedBuffer: Buffer.from("expected-buffer"),
            diffBuffer: Buffer.from("diff-buffer"),
            snapshotName: "snapshot",
            expectedPath: "expected-path",
            actualPath: "actual-path",
            diffPath: "diff-path",
        });
    });
});
