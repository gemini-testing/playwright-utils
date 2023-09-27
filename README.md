# playwright-utils

Usefull [playwright][pwt] utilities, such as fixtures, custom commands and matchers.

## Installation

```bash
npm install --save-dev @gemini-testing/playwright-utils
```

## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Matchers](#matchers)
  - [ToMatchScreenshot](#tomatchscreenshot)
    - [Usage](#usage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Matchers
- [toMatchScreenshot](#tomatchscreenshot)

### ToMatchScreenshot

[looks-same][looks-same] based visual comparison. It uses [CIEDE2000][ciede2000] based tolerance instead of pixelmatch (which is used under the hood of `toHaveScreenshot`) [YIQ NTSC transmission color space][yiq-ntsc] threshold, which has [severe problems](https://github.com/mapbox/pixelmatch/issues/127) calculating the color difference in shades of blue.

#### Usage

Setup:

```typescript
// playwright.ts
import { test as base, expect } from "@playwright/test";
import { createMatchersCombinedFixture } from "@gemini-testing/playwright-utils";

const test = base.extend(createMatchersCombinedFixture(expect));

export { test, expect };
```

```typescript
// playwright.config.ts
import { defineConfig, type PlaywrightTestOptions } from '@playwright/test';
import type { PlaywrightUtilsOptions } from "@gemini-testing/playwright-utils";


export default defineConfig<PlaywrightTestOptions, PlaywrightUtilsOptions>({
    // ...
    use: {
        // ...
        toMatchScreenshotOptions: {
            // Default project config
            tolerance: 2.3,
            antialiasingTolerance: 4,
            animations: "disabled",
            caret: "hide",
            timeout: 30000
        }
    }
});
```

Usage:

```typescript
await expect(page.locator('body')).toMatchScreenshot('plain', {
    // Comparison config, have higher priority than project config, optional
    maxDiffPixels: 3
});
```

Args:
- snapshotName: `string`
- opts?: `Object`
  - [tolerance][looks-same-tolerance]: `number`
  - [antialiasingTolerance][looks-same-antialiasing-tolerance]: `number`
  - [maxDiffPixels][pwt-max-diff-pixels]: `number`
  - [maxDiffPixelRatio][pwt-max-diff-pixels-ratio]: `number`
  - [animations][pwt-animations]: `"disabled" | "allow"`
  - [caret][pwt-caret]: `"hide" | "initial"`
  - [scale][pwt-scale]: `"css" | "device"`
  - [fullPage][pwt-full-page]: `boolean`
  - timeout: `number`

[pwt]: https://playwright.dev/
[looks-same]: https://github.com/gemini-testing/looks-same
[ciede2000]: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
[yiq-ntsc]: http://www.progmat.uaem.mx:8080/artVol2Num2/Articulo3Vol2Num2.pdf
[looks-same-tolerance]: https://github.com/gemini-testing/looks-same#comparing-images
[looks-same-antialiasing-tolerance]: https://github.com/gemini-testing/looks-same#comparing-images-with-ignoring-antialiasing
[pwt-max-diff-pixels]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-max-diff-pixels
[pwt-max-diff-pixels-ratio]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-max-diff-pixel-ratio
[pwt-animations]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-animations
[pwt-caret]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-caret
[pwt-scale]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-scale
[pwt-full-page]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-full-page
