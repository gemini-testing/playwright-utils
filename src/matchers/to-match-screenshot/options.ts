import type { LooksSameOptions } from "looks-same";
import type { PageScreenshotOptions as ScreenshotOpts } from "@playwright/test";

type IgnoreDiffPixels = { maxDiffPixelRatio: number; maxDiffPixels: number };

export type UserScreenshotOptions = Pick<ScreenshotOpts, "animations" | "caret" | "mask" | "maskColor">;
export type UserCompareOptions = Pick<LooksSameOptions, "tolerance" | "antialiasingTolerance"> & IgnoreDiffPixels;

type LooksSameCompareOptions = LooksSameOptions & { createDiffImage: true };
type CompareOpts = LooksSameCompareOptions & IgnoreDiffPixels;

export type Options = UserScreenshotOptions & UserCompareOptions & IgnoreDiffPixels;
export type PreparedOptions = {
    screenshotOpts: ScreenshotOpts;
    compareOpts: CompareOpts;
};

export const defaultOptions: Options = {
    // Compare options
    tolerance: 2.3,
    antialiasingTolerance: 4,
    maxDiffPixels: 0,
    maxDiffPixelRatio: 0,

    // Screenshot options
    animations: "disabled",
    caret: "hide",
    maskColor: "#000000",
};

export const getOptions = (
    userOptions: Partial<Options> = {},
    projectOptions: Partial<Options> = {},
    defaultOptions: Options,
): PreparedOptions => {
    const userCompareOptionNames: Array<keyof UserCompareOptions> = [
        "tolerance",
        "antialiasingTolerance",
        "maxDiffPixels",
        "maxDiffPixelRatio",
    ];

    const userCompareOpts = userCompareOptionNames.reduce((acc, optionName) => {
        acc[optionName] = userOptions[optionName] ?? projectOptions[optionName] ?? defaultOptions[optionName]!;

        return acc;
    }, {} as UserCompareOptions);

    const compareOpts: CompareOpts = {
        ...userCompareOpts,
        createDiffImage: true,
        ignoreCaret: false,
        ignoreAntialiasing: Boolean(userCompareOpts.antialiasingTolerance),
    };

    const screenshotOpts: ScreenshotOpts = {
        animations: userOptions.animations ?? projectOptions.animations ?? defaultOptions.animations,
        caret: userOptions.caret ?? projectOptions.caret ?? defaultOptions.caret,
        maskColor: userOptions.maskColor ?? projectOptions.maskColor ?? defaultOptions.maskColor,
        mask: userOptions.mask,
    };

    return { compareOpts, screenshotOpts };
};
