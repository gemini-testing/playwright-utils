# playwright-utils

Usefull [playwright][pwt] utilities, such as fixtures, custom commands and matchers.

## Installation

```bash
npm install --save-dev @gemini-testing/playwright-utils
```

## Contents
- [Fixtures](#fixtures)
- [Matchers](#matchers)
  - [toMatchScreenshot](#tomatchscreenshot)

## Fixtures

## Matchers
- [toMatchScreenshot](#tomatchscreenshot)


### ToMatchScreenshot

[looks-same][looks-same] based visual comparison. It uses [CIEDE2000][ciede2000] based tolerance instead of pixelmatch (which is used under the hood of `toHaveScreenshot`) [YIQ NTSC transmission color space][yiq-ntsc] threshold, which has [severe problems](https://github.com/mapbox/pixelmatch/issues/127) calculating the color difference in shades of blue.

#### Usage

Setup:

```typescript
// playwright.ts
import { test, expect } from "@playwright/test";
import { createToMatchScreenshot } from "@gemini-testing/playwright-utils";

const toMatchScreenshot = createToMatchScreenshot(test, {
    // Default project config
    tolerance: 2.3,
    antialiasingTolerance: 4,
    animations: "disabled",
    caret: "hide",
});

expect.extend({toMatchScreenshot});

export { test, expect };
```

```typescript
// global.d.ts
import type { PwtUtilsMatchers } from "@gemini-testing/playwright-utils";

export {};

declare global {
 namespace PlaywrightTest {
    interface Matchers<R, T> extends PwtUtilsMatchers<R,T, "toMatchScreenshot"> {}
  }
}
```

Usage:

```typescript
await expect(page.locator('body')).toMatchScreenshot('plain', {
    // Comparison config, optional
});
```

Args:
- stateName: `string`
- opts?: `Object`
  - [tolerance][looks-same-tolerance]: `number`
  - [antialiasingTolerance][looks-same-antialiasing-tolerance]: `number`
  - [animations][pwt-animations]: `"disabled" | "allow"`
  - [caret][pwt-caret]: `"hide" | "initial"`

[pwt]: https://playwright.dev/
[looks-same]: https://github.com/gemini-testing/looks-same
[ciede2000]: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
[yiq-ntsc]: http://www.progmat.uaem.mx:8080/artVol2Num2/Articulo3Vol2Num2.pdf
[looks-same-tolerance]: https://github.com/gemini-testing/looks-same#comparing-images
[looks-same-antialiasing-tolerance]: https://github.com/gemini-testing/looks-same#comparing-images-with-ignoring-antialiasing
[pwt-animations]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-animations
[pwt-caret]: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-caret
