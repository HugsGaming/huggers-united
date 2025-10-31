import mongoose, {Document, Schema} from "mongoose";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger";

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    comparePassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        username:  {type: String, required: true, unique: true},
        email: {type: String, required: true, unique: true},
        passwordHash: {type: String, required: true},
    },
    {
        timestamps: true
    }
)

UserSchema.pre<IUser>("save", async function (next) {
    if (this.isModified("passwordHash")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        } catch (error: any) {
            logger.error("Error hashing password", error);
            return next(error);
        }
    }
    next();
});

UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
}

export default mongoose.model<IUser>("User", UserSchema);
