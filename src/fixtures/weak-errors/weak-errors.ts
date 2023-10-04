import { createLogger } from "../../utils/logger";

const logger = createLogger("weak-errors");

export default class WeakErrors {
    private errors: Error[] = [];

    addError(error: Error): void {
        logger.error(error);

        this.errors.push(error);
    }

    getError(): Error | null {
        if (this.errors.length === 0) {
            return null;
        }

        const offset = Error.name.length + 2;
        const errorMessages = this.errors.map(error => error.message);
        const errorMessage = errorMessages.join("\n" + " ".repeat(offset));

        const error = new Error(errorMessage);
        error.stack = this.errors[0].stack;

        return error;
    }
}
