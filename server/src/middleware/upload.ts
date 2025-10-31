import multer from "multer";

const storage = multer.memoryStorage();

/**
 * Multer middleware to handle file uploads.
 * @type {Multer}
 * @see https://www.npmjs.com/package/multer
 * @see https://www.npmjs.com/package/multer-memory-storage
 * @see https://www.npmjs.com/package/express-validator
 * @see https://www.npmjs.com/package/express
 */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    /**
     * Filters out files that are not of type image/jpeg, image/png or image/webp.
     * @param {Request} req - The express request object.
     * @param {File} file - The file being uploaded.
     * @param {(error: null, accepted: boolean) => void} cb - The callback to be called with the result of the filter.
     */
    fileFilter: (req, file, cb) => {
        if(
            file.mimetype == "image/jpeg" ||
            file.mimetype == "image/png" ||
            file.mimetype == "image/webp"
        ) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

export default upload;
