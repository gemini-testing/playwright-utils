import _ from "lodash";
import type { PageScreenshotOptions as ScreenshotOpts } from "@playwright/test";
import type { LooksSameOptions } from "looks-same";
import type { LocatorLike } from "../types";

export type UserScreenshotOptions = Pick<
    ScreenshotOpts,
    "animations" | "caret" | "maskColor" | "scale" | "timeout" | "fullPage"
> & { mask?: Array<LocatorLike> };

type LooksSameCompareOptions = LooksSameOptions & { createDiffImage: true };
type IgnoreDiffPixels = { maxDiffPixelRatio: number; maxDiffPixels: number };
type CompareOpts = LooksSameCompareOptions & IgnoreDiffPixels & { stopOnImageDiff: boolean };

export type UserCompareOptions = Partial<
    Pick<CompareOpts, "tolerance" | "antialiasingTolerance" | "maxDiffPixels" | "maxDiffPixelRatio" | "stopOnImageDiff">
>;

export type Options = UserScreenshotOptions & UserCompareOptions;
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
    stopOnImageDiff: true,

    // Screenshot options
    animations: "disabled",
    caret: "hide",
    maskColor: "#FF00FF",
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
        "stopOnImageDiff",
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

    const compareOpts = {
        ...userCompareOpts,
        highlightColor: "#FF0000",
        createDiffImage: true,
        ignoreCaret: false,
        ignoreAntialiasing: Boolean(userCompareOpts.antialiasingTolerance),
    } as CompareOpts;

    const screenshotOpts = {
        ...userScreenshotOptions,
        mask: userOptions.mask,
    } as ScreenshotOpts;

    return { compareOpts, screenshotOpts };
};
