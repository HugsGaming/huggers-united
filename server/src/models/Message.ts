import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
    sender: Types.ObjectId;
    match: Types.ObjectId;
    content: string;
    read: boolean;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        match: {
            type: Schema.Types.ObjectId,
            ref: "Match",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model<IMessage>("Message", MessageSchema);
