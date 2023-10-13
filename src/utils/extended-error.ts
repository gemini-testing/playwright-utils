type WithType<T> = { type: string } & T;

export class UtilsExtendedError<T> extends Error {
    #meta: WithType<T>;

    constructor(message: string, meta: WithType<T>) {
        super(message);

        this.#meta = meta;
    }

    get meta(): WithType<T> {
        return this.#meta;
    }
}

// Change error name to be `Error`, so error looks like `Error: some error` instead of `UtilsExtendedError: some error`
Object.defineProperty(UtilsExtendedError.prototype.constructor, "name", {
    value: UtilsExtendedError.prototype.name,
    configurable: false,
});
