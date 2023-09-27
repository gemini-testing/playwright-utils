import _ from "lodash";
import type { LooksSameOptions } from "looks-same";
import type { PageScreenshotOptions as ScreenshotOpts } from "@playwright/test";

type IgnoreDiffPixels = { maxDiffPixelRatio: number; maxDiffPixels: number };

export type UserScreenshotOptions = Pick<
    ScreenshotOpts,
    "animations" | "caret" | "mask" | "maskColor" | "scale" | "timeout" | "fullPage"
>;
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
    scale: "css",
    timeout: 30000,
    fullPage: false,
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

    const userScreenshotOptionNames: Array<keyof UserScreenshotOptions> = [
        "animations",
        "caret",
        "maskColor",
        "scale",
        "timeout",
        "fullPage",
    ];

    const userCompareOpts = userCompareOptionNames.reduce((acc, optionName) => {
        return _.set(
            acc,
            optionName,
            userOptions[optionName] ?? projectOptions[optionName] ?? defaultOptions[optionName],
        );
    }, {} as UserCompareOptions);

    const userScreenshotOptions = userScreenshotOptionNames.reduce((acc, optionName) => {
        return _.set(
            acc,
            optionName,
            userOptions[optionName] ?? projectOptions[optionName] ?? defaultOptions[optionName],
        );
    }, {} as UserScreenshotOptions);

    const compareOpts: CompareOpts = {
        ...userCompareOpts,
        createDiffImage: true,
        ignoreCaret: false,
        ignoreAntialiasing: Boolean(userCompareOpts.antialiasingTolerance),
    };

    const screenshotOpts: ScreenshotOpts = {
        ...userScreenshotOptions,
        mask: userOptions.mask,
    };

    return { compareOpts, screenshotOpts };
};
