import type { TestInfo } from "@playwright/test";
import WeakErrors from "./weak-errors";
import { createLogger } from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
    createLogger: jest.fn().mockReturnValue({ error: jest.fn() }),
}));

describe("WeakErrors", () => {
    const logger = createLogger();
    let testInfo: { errors: Array<Error>; status?: string };
    let weakErrors: WeakErrors;

    beforeEach(() => {
        testInfo = { errors: [] };
        weakErrors = new WeakErrors(testInfo as unknown as TestInfo);
    });

    describe("addError", () => {
        it("should log the error to console", () => {
            const error = new Error("some error");

            weakErrors.addError(error);

            expect(logger.error).toBeCalledWith(error);
        });

        it("should add the error to test info", () => {
            const error = Object.assign(new Error("some error"), { meta: "some meta" });

            weakErrors.addError(error);

            expect(testInfo.errors).toEqual([{ message: "Error: some error", meta: "some meta" }]);
        });
    });

    describe("updateTestStatus", () => {
        describe("should do nothing", () => {
            ["failed", "timedOut", "interrupted"].forEach(status => {
                it(`if test has some weak error and status is ${status}`, () => {
                    testInfo.status = status;
                    weakErrors.addError(new Error("some error"));

                    weakErrors.updateTestStatus();

                    expect(testInfo.status).toBe(status);
                });
            });

            ["passed", "skipped", "failed", "timedOut", "interrupted"].forEach(status => {
                it(`if test does not have weak errors and status is ${status}`, () => {
                    testInfo.status = status;

                    weakErrors.updateTestStatus();

                    expect(testInfo.status).toBe(status);
                });
            });
        });

        describe("should fail test", () => {
            ["passed", "skipped"].forEach(status => {
                it(`is test has some weak error and status is ${status}`, () => {
                    testInfo.status = status;
                    weakErrors.addError(new Error("some error"));

                    weakErrors.updateTestStatus();

                    expect(testInfo.status).toBe("failed");
                });
            });
        });
    });
});
