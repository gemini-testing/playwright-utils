import type { TestInfo, TestInfoError } from "@playwright/test";
import { UtilsExtendedError } from "../../utils/extended-error";
import { createLogger } from "../../utils/logger";

const logger = createLogger("weak-errors");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtendedError = UtilsExtendedError<Record<string, any>>;

export default class WeakErrors {
    private testInfo: TestInfo;
    private hasErrors = false;

    constructor(testInfo: TestInfo) {
        this.testInfo = testInfo;
    }

    addError(error: Error | ExtendedError): void {
        logger.error(error);

        const testInfoError = {
            message: `${error.name}: ${error.message}`,
            meta: (error as ExtendedError).meta,
        } as TestInfoError;

        this.testInfo.errors.push(testInfoError);
        this.hasErrors = true;
    }

    updateTestStatus(): void {
        const isTestSuccess = ["passed", "skipped"].includes(this.testInfo.status!);

        if (this.hasErrors && isTestSuccess) {
            this.testInfo.status = "failed";
        }
    }
}
