import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProfile extends Document {
    user: Types.ObjectId;
    name: string;
    bio: string;
    profilePicture: string;
    gender: string;
    interests: string[];
    dateOfBirth: Date;
}

const ProfileSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        name: { type: String, required: [true, "Name is required. Please enter your name"], trim: true },
        bio: { type: String, required: [true, "Bio is required. Please enter your bio"], trim: true, default: "" },
        profilePicture: { type: String, required: true, default: "" },
        gender: { type: String, required: [true, "Gender is required. Please enter your gender"], trim: true, default: "" },
        interests: { type: [String], required: true, default: [] },
        dateOfBirth: { type: Date, required: true },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IProfile>("Profile", ProfileSchema);
