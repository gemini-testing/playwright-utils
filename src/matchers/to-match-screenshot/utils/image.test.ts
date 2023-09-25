import type { TestInfo } from "@playwright/test";
import imageUtils from "./image";

describe("utils/image", () => {
    describe("attachment", () => {
        [
            { fn: imageUtils.createActualAttachment, suffix: "actual" },
            { fn: imageUtils.createDiffAttachment, suffix: "diff" },
            { fn: imageUtils.createExpectedAttachment, suffix: "expected" },
        ].forEach(({ fn, suffix }) => {
            it(`should create ${suffix} attachment`, () => {
                const result = fn("snapshot-name", "path");

                expect(result).toEqual({
                    path: "path",
                    contentType: "image/png",
                    name: `snapshot-name-${suffix}`,
                });
            });
        });
    });

    describe("screenshot path", () => {
        it("get screenshot snapshot path", () => {
            const testInfoStub = { snapshotPath: (path: string): string => `snapshot/${path}` } as TestInfo;

            const result = imageUtils.getScreenshotSnapshotPath(testInfoStub, "snapshot name");

            expect(result).toBe("snapshot/snapshot-name.png");
        });

        [
            { fn: imageUtils.getScreenshotActualPath, suffix: "actual" },
            { fn: imageUtils.getScreenshotDiffPath, suffix: "diff" },
            { fn: imageUtils.getScreenshotExpectedPath, suffix: "expected" },
        ].forEach(({ fn, suffix }) => {
            it(`should get screenshot ${suffix} path`, () => {
                const testInfoStub = {
                    outputDir: "output/dif",
                    titlePath: ["file", "full", "title"],
                } as TestInfo;

                const result = fn(testInfoStub, "snapshot name");

                expect(result).toBe(`output/dif/full-title-snapshot-name-${suffix}.png`);
            });
        });
    });
});
