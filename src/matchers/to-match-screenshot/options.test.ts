import type { Locator } from "@playwright/test";
import { getOptions, type UserScreenshotOptions, type UserCompareOptions, type Options } from "./options";

describe("getOptions", () => {
    let screenshotOpts: UserScreenshotOptions;
    let compareOpts: UserCompareOptions;
    let defaultOptions: Options;

    beforeEach(() => {
        compareOpts = {
            tolerance: 2.3,
            antialiasingTolerance: 4,
            maxDiffPixels: 0,
            maxDiffPixelRatio: 0,
            stopOnImageDiff: true,
        };
        screenshotOpts = {
            animations: "disabled",
            caret: "hide",
            maskColor: "#000000",
        };
        defaultOptions = { ...compareOpts, ...screenshotOpts };
    });

    it("should use default options", () => {
        const options = getOptions({}, {}, defaultOptions);

        expect(options.compareOpts).toMatchObject(compareOpts);
        expect(options.screenshotOpts).toMatchObject(screenshotOpts);
    });

    describe("should add extra screenshot options", () => {
        it("base", () => {
            const options = getOptions({}, {}, defaultOptions);

            expect(options.compareOpts).toMatchObject({
                createDiffImage: true,
                ignoreCaret: false,
            });
        });

        it("without antialiasing", () => {
            const options = getOptions({}, {}, { ...defaultOptions, antialiasingTolerance: 0 });

            expect(options.compareOpts).toMatchObject({
                ignoreAntialiasing: false,
            });
        });

        it("with antialiasing", () => {
            const options = getOptions({}, {}, { ...defaultOptions, antialiasingTolerance: 3 });

            expect(options.compareOpts).toMatchObject({
                ignoreAntialiasing: true,
            });
        });
    });

    it("should ignore screenshot mask from project and default configs", () => {
        const locator = "locator" as unknown as Locator;

        const options = getOptions({}, { mask: [locator] }, { ...defaultOptions, mask: [locator] });

        expect(options.screenshotOpts.mask).toBeUndefined();
    });

    it("should include screenshot mask from user config", () => {
        const locator = "locator" as unknown as Locator;

        const options = getOptions({ mask: [locator] }, {}, defaultOptions);

        expect(options.screenshotOpts.mask).toEqual([locator]);
    });
});
