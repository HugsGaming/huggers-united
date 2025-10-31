import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILike extends Document {
    liker: Types.ObjectId;
    liked: Types.ObjectId;
    status: "liked" | "disliked";
    createdAt: Date;
}

const LikeSchema: Schema = new Schema(
    {
        liker: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        liked: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        status: { type: String, enum: ["liked", "disliked"], required: true },
    },
    {
        timestamps: true,
    }
);

LikeSchema.index({ liker: 1, liked: 1 }, { unique: true });

export default mongoose.model<ILike>("Like", LikeSchema);
