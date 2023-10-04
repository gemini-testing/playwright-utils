import type { Fixtures, TestFixture } from "@playwright/test";
import WeakErrorsManager from "./weak-errors";

export type WeakErrors = WeakErrorsManager;
export type WeakErrorOptions = { weakErrors: WeakErrors };

type WeakErrorsFixture = TestFixture<WeakErrors, never>;

export const weakErrorsFixture: Fixtures<WeakErrorsFixture> = {
    weakErrors: [
        // eslint-disable-next-line no-empty-pattern
        async function ({}, use): Promise<void> {
            const weakErrors = new WeakErrorsManager();

            await use(weakErrors);

            const error = weakErrors.getError();

            if (error) {
                throw error;
            }
        } as WeakErrorsFixture,
        { scope: "test", auto: true },
    ],
};
