import type { TestInfo } from "@playwright/test";
import colors from "colors";
import handlers from "./handlers";
import fsUtils from "./utils/fs";
import type { WeakErrors } from "../../fixtures";

jest.mock("./utils/fs", () => ({
    addSuffixToFilePath: jest.fn().mockImplementation((path: string, suffix: string) => `${path}-${suffix}`),
    writeFile: jest.fn(),
}));

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

    it("handleMatchingNegated", () => {
        const result = handlers.handleMatchingNegated();

        expect(result.pass).toBe(true);
        expect(result.message()).toBe(
            [
                colors.red("Screenshot comparison failed:"),
                "",
                "  Expected result should be different from the actual one.",
            ].join("\n"),
        );
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

            expect(result.pass).toBe(true);
            expect(result.message()).toBe("");
            expect(weakErrors.addError).toBeCalledWith(
                new Error("A snapshot doesn't exist at snapshot-path, writing actual."),
            );
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
            expect(result.message()).toBe("A snapshot doesn't exist at snapshot-path.");
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

    it("handleDifferent", async () => {
        const result = await handlers.handleDifferent({
            testInfo,
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

        expect(result.pass).toBe(false);
        expect(result.message()).toBe(
            [
                colors.red("Screenshot comparison failed"),
                "",
                `Expected: ${colors.yellow("expected-path")}`,
                `Received: ${colors.yellow("actual-path")}`,
                `    Diff: ${colors.yellow("diff-path")}`,
            ].join("\n"),
        );
    });

    it("handleMatching", () => {
        const result = handlers.handleMatching();

        expect(result.pass).toBe(true);
        expect(result.message()).toBe("");
    });
});
