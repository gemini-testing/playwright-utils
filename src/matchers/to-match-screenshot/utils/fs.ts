import path from "path";
import fs from "fs";

export const addSuffixToFilePath = (filePath: string, suffix: string, delimeter = "-"): string => {
    const dirname = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const base = path.join(dirname, name);

    return base + delimeter + suffix + ext;
};

export const writeFile = async (filePath: string, data: string | NodeJS.ArrayBufferView): Promise<void> => {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, data);
};

export const readFile = fs.promises.readFile;

export const exists = (filePath: string): Promise<boolean> =>
    new Promise(resolve => {
        fs.promises
            .access(filePath, fs.constants.F_OK)
            .then(() => resolve(true))
            .catch(() => resolve(false));
    });

export default { addSuffixToFilePath, writeFile, readFile, exists };
