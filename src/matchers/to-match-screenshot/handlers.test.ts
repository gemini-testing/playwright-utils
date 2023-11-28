import type { TestInfo } from "@playwright/test";
import colors from "colors";
import handlers from "./handlers";
import fsUtils from "./utils/fs";
import type { WeakErrors } from "../../fixtures";
import type { MatcherResult } from "./types";
import { UtilsExtendedError } from "../../utils/extended-error";

jest.mock("./utils/fs", () => ({
    addSuffixToFilePath: jest.fn().mockImplementation((path: string, suffix: string) => `${path}-${suffix}`),
    writeFile: jest.fn(),
}));

type HandleDifferent_ = (args?: Partial<Parameters<typeof handlers.handleDifferent>[0]>) => Promise<MatcherResult>;

describe("handlers", () => {
    let testInfo: TestInfo;
    let weakErrors: WeakErrors;

    beforeEach(() => {
        testInfo = { attachments: [] } as unknown as TestInfo;
        weakErrors = { addError: jest.fn() } as unknown as WeakErrors;
    });

    describe("handleMissingNegated", () => {
        it("should pass if updateSnapshots is 'missing'", () => {
            const result = handlers.handleMissingNegated({ updateSnapshots: "missing", snapshotPath: "path" });

            expect(result.pass).toBe(true);
            expect(result.message()).toBe(
                ["A snapshot doesn't exist at path,", 'matchers using ".not" won\'t write them automatically.'].join(
                    " ",
                ),
            );
        });

        it("should fail if updateSnapshots is 'none'", () => {
            const result = handlers.handleMissingNegated({ updateSnapshots: "none", snapshotPath: "path" });

            expect(result.pass).toBe(true);
            expect(result.message()).toBe("A snapshot doesn't exist at path.");
        });
    });

    it("handleDifferentNegated", () => {
        const result = handlers.handleDifferentNegated();

        expect(result.pass).toBe(false);
        expect(result.message()).toBe("");
    });

    describe("handleMatchingNegated", () => {
        it("should pass if stopOnFirstImageDiff is 'true'", () => {
            const result = handlers.handleMatchingNegated({
                snapshotName: "snapshot-name",
                weakErrors,
                stopOnFirstImageDiff: true,
            });

            const expectedMessage = [
                colors.red("Screenshot comparison failed:"),
                "",
                'Snapshot: "snapshot-name"',
                "",
                "  Expected result should be different from the actual one.",
            ].join("\n");
            expect(weakErrors.addError).not.toBeCalled();
            expect(result.pass).toBe(true);
            expect(result.message()).toBe(expectedMessage);
        });

        it("should fail if stopOnFirstImageDiff is 'false'", () => {
            const result = handlers.handleMatchingNegated({
                snapshotName: "snapshot-name",
                weakErrors,
                stopOnFirstImageDiff: false,
            });

            const errorMessage = [
                colors.red("Screenshot comparison failed:"),
                "",
                'Snapshot: "snapshot-name"',
                "",
                "  Expected result should be different from the actual one.",
            ].join("\n");
            expect(weakErrors.addError).toBeCalledWith(new Error(errorMessage));
            expect(result.pass).toBe(false);
            expect(result.message()).toBe("");
        });
    });

    it("handleNotExists", () => {
        const result = handlers.handleNotExists({ snapshotPath: "snapshot-path" });

        expect(result.pass).toBe(false);
        expect(result.message()).toBe("A snapshot doesn't exist at snapshot-path.");
    });

    describe("handleMissing", () => {
        it("should pass with soft error if updateSnapshots is 'missing'", async () => {
            const result = await handlers.handleMissing({
                testInfo,
                weakErrors,
                updateSnapshots: "missing",
                snapshotName: "snapshot-name",
                snapshotPath: "snapshot-path",
                actualPath: "actual-path",
                actualBuffer: Buffer.from("actual-buffer"),
            });

            const errorMessage = 'A snapshot "snapshot-name" doesn\'t exist at snapshot-path, writing actual.';
            const weakError = new UtilsExtendedError(errorMessage, {
                type: "NoRefImageError",
                snapshotName: "snapshot-name",
            });

            expect(result.pass).toBe(true);
            expect(result.message()).toBe("");
            expect(weakErrors.addError).toBeCalledWith(weakError);
        });

        it("should write files if updateSnapshots is 'missing'", async () => {
            await handlers.handleMissing({
                testInfo,
                weakErrors,
                updateSnapshots: "missing",
                snapshotName: "snapshot-name",
                snapshotPath: "snapshot-path",
                actualPath: "actual-path",
                actualBuffer: Buffer.from("actual-buffer"),
            });

            expect(fsUtils.writeFile).toBeCalledWith("snapshot-path", Buffer.from("actual-buffer"));
            expect(fsUtils.writeFile).toBeCalledWith("actual-path", Buffer.from("actual-buffer"));
            expect(testInfo.attachments).toEqual([
                {
                    contentType: "image/png",
                    name: "snapshot-name-actual",
                    path: "actual-path",
                },
            ]);
        });

        it("should fail if updateSnapshots is 'none'", async () => {
            const result = await handlers.handleMissing({
                testInfo,
                weakErrors,
                updateSnapshots: "none",
                snapshotName: "snapshot-name",
                snapshotPath: "snapshot-path",
                actualPath: "actual-path",
                actualBuffer: Buffer.from("actual-buffer"),
            });

            expect(result.pass).toBe(false);
            expect(result.message()).toBe('A snapshot "snapshot-name" doesn\'t exist at snapshot-path.');
        });

        it("should not write files if updateSnapshots is 'none'", async () => {
            await handlers.handleMissing({
                testInfo,
                weakErrors,
                updateSnapshots: "none",
                snapshotName: "snapshot-name",
                snapshotPath: "snapshot-path",
                actualPath: "actual-path",
                actualBuffer: Buffer.from("actual-buffer"),
            });

            expect(fsUtils.writeFile).not.toBeCalled();
            expect(testInfo.attachments).toEqual([]);
        });
    });

    it("handleUpdating", async () => {
        const result = await handlers.handleUpdating({
            snapshotPath: "snapshot-path",
            actualPath: "actual-path",
            actualBuffer: Buffer.from("actual-buffer"),
        });

        expect(fsUtils.writeFile).toBeCalledWith("snapshot-path", Buffer.from("actual-buffer"));
        expect(fsUtils.writeFile).toBeCalledWith("actual-path", Buffer.from("actual-buffer"));

        expect(result.pass).toBe(true);
        expect(result.message()).toBe("snapshot-path running with --update-snapshots, writing actual.");
    });

    describe("handleDifferent", () => {
        const handleDifferent_: HandleDifferent_ = (args = {}) =>
            handlers.handleDifferent({
                testInfo,
                weakErrors,
                stopOnFirstImageDiff: false,
                actualBuffer: Buffer.from("actual-buffer"),
                expectedBuffer: Buffer.from("expected-buffer"),
                diffBuffer: Buffer.from("diff-buffer"),
                snapshotName: "snapshot-name",
                expectedPath: "expected-path",
                actualPath: "actual-path",
                diffPath: "diff-path",
                diffClusters: [],
                ...args,
            });

        describe("should save expected/actual/diff images", () => {
            [true, false].forEach(stopOnFirstImageDiff => {
                it(`if stopOnFirstImageDiff is '${stopOnFirstImageDiff}'`, async () => {
                    await handleDifferent_({
                        weakErrors,
                        stopOnFirstImageDiff,
                        actualBuffer: Buffer.from("actual-buffer"),
                        expectedBuffer: Buffer.from("expected-buffer"),
                        diffBuffer: Buffer.from("diff-buffer"),
                        snapshotName: "snapshot-name",
                        expectedPath: "expected-path",
                        actualPath: "actual-path",
                        diffPath: "diff-path",
                    });

                    expect(fsUtils.writeFile).toBeCalledWith("expected-path", Buffer.from("expected-buffer"));
                    expect(fsUtils.writeFile).toBeCalledWith("actual-path", Buffer.from("actual-buffer"));
                    expect(fsUtils.writeFile).toBeCalledWith("diff-path", Buffer.from("diff-buffer"));
                });
            });
        });

        it("should fail if stopOnFirstImageDiff is 'true'", async () => {
            const result = await handleDifferent_({ stopOnFirstImageDiff: true });

            const expectedMessage = [
                colors.red("Screenshot comparison failed"),
                "",
                'Snapshot: "snapshot-name"',
                "",
                `Expected: ${colors.yellow("expected-path")}`,
                `Received: ${colors.yellow("actual-path")}`,
                `    Diff: ${colors.yellow("diff-path")}`,
            ].join("\n");

            expect(weakErrors.addError).not.toBeCalled();
            expect(result.pass).toBe(false);
            expect(result.message()).toBe(expectedMessage);
        });

        it("should pass if stopOnFirstImageDiff is 'false'", async () => {
            const result = await handleDifferent_({ stopOnFirstImageDiff: false });

            const errorMessage = [
                colors.red("Screenshot comparison failed"),
                "",
                'Snapshot: "snapshot-name"',
                "",
                `Expected: ${colors.yellow("expected-path")}`,
                `Received: ${colors.yellow("actual-path")}`,
                `    Diff: ${colors.yellow("diff-path")}`,
            ].join("\n");

            expect(weakErrors.addError).toBeCalledWith(new Error(errorMessage));
            expect(result.pass).toBe(true);
            expect(result.message()).toBe("");
        });
    });

    describe("handleMatching", () => {
        [true, false].forEach(saveImage => {
            it(`should pass with empty message if saveImageOnScreenshotMatch is '${saveImage}'`, async () => {
                const result = await handlers.handleMatching({
                    testInfo,
                    saveImageOnScreenshotMatch: saveImage,
                    expectedBuffer: Buffer.from("expected-buffer"),
                    snapshotName: "snapshot-name",
                    expectedPath: "expected-path",
                });

                expect(result.pass).toBe(true);
                expect(result.message()).toBe("");
            });
        });

        it("should save and attach actual image if saveImageOnScreenshotMatch is 'true'", async () => {
            await handlers.handleMatching({
                testInfo,
                saveImageOnScreenshotMatch: true,
                expectedBuffer: Buffer.from("expected-buffer"),
                snapshotName: "snapshot-name",
                expectedPath: "expected-path",
            });

            expect(fsUtils.writeFile).toBeCalledWith("expected-path", Buffer.from("expected-buffer"));
            expect(testInfo.attachments).toEqual([
                {
                    contentType: "image/png",
                    name: "snapshot-name-expected",
                    path: "expected-path",
                },
            ]);
        });

        it("should not save and attach image if saveImageOnScreenshotMatch is 'false'", async () => {
            await handlers.handleMatching({
                testInfo,
                saveImageOnScreenshotMatch: false,
                expectedBuffer: Buffer.from("expected-buffer"),
                snapshotName: "snapshot-name",
                expectedPath: "expected-path",
            });

            expect(fsUtils.writeFile).not.toBeCalled();
            expect(testInfo.attachments).toEqual([]);
        });
    });
});
