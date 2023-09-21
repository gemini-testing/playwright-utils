import fs from "fs";
import { when } from "jest-when";
import fsUtils from "./fs";

jest.mock("fs", () => ({
    promises: {
        mkdir: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        access: jest.fn(),
    },
    constants: { F_OK: "F_OK" },
}));

describe("utils/fs", () => {
    it("addSuffixToFilePath", () => {
        const result = fsUtils.addSuffixToFilePath("file/path.ext", "suffix", "+");

        expect(result).toBe("file/path+suffix.ext");
    });

    it("writeFile", async () => {
        await fsUtils.writeFile("deep/file/path.ext", "some-data");

        expect(fs.promises.mkdir).toBeCalledWith("deep/file", { recursive: true });
        expect(fs.promises.writeFile).toBeCalledWith("deep/file/path.ext", "some-data");
    });

    describe("exists", () => {
        beforeEach(() => {
            when(fs.promises.access)
                .calledWith("not-exists", fs.constants.F_OK)
                .mockRejectedValue(new Error())
                .calledWith("exists", fs.constants.F_OK)
                .mockResolvedValue();
        });

        it("file not exists", async () => {
            await expect(fsUtils.exists("not-exists")).resolves.toBe(false);
        });

        it("file not exists", async () => {
            await expect(fsUtils.exists("exists")).resolves.toBe(true);
        });
    });
});
