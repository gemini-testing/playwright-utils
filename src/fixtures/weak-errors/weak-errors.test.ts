import WeakErrors from "./weak-errors";
import { createLogger } from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
    createLogger: jest.fn().mockReturnValue({ error: jest.fn() }),
}));

describe("WeakErrors", () => {
    const logger = createLogger();
    let weakErrors: WeakErrors;

    beforeEach(() => {
        weakErrors = new WeakErrors();
    });

    describe("addError", () => {
        it("should log an error to console", () => {
            const error = new Error("some error");

            weakErrors.addError(error);

            expect(logger.error).toBeCalledWith(error);
        });
    });

    describe("getError", () => {
        it("should return null if there are no errors", () => {
            const error = weakErrors.getError();

            expect(error).toBeNull();
        });

        it("should combine multiple errors", () => {
            weakErrors.addError(new Error("error 1"));
            weakErrors.addError(new Error("error 2"));
            weakErrors.addError(new Error("error 3"));

            const combinedError = weakErrors.getError();

            const expectedErrorMessage = ["error 1", "       error 2", "       error 3"].join("\n");
            expect(combinedError?.message).toBe(expectedErrorMessage);
        });
    });
});
