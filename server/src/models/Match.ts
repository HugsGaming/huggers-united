import mongoose, { Document, Schema, Types} from "mongoose";

export interface IMatch extends Document {
    users: Types.ObjectId[]; // Array of user IDs representing the matched users
    messages: Types.ObjectId[]; // Array of message IDs representing the messages between the matched users
    createdAt: Date;
    updatedAt: Date;
}

const MatchSchema: Schema = new Schema(
    {
        users: {
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
            required: true,
            validate: {
                validator: function (v: Types.ObjectId[]) {
                    return v.length === 2
                },
                message: (props: any) => `${props.value} users are not allowed`
            },
        },
        messages: { 
            type: [{ type: Schema.Types.ObjectId, ref: "Message" }],
            default: [] 
        },
    }
)

// Create a unique index to ensure that there is only one match between two users
MatchSchema.index(
    { 
        users: 1 
    }, 
    { 
        unique: true, 
        partialFilterExpression: {
            'users.1': { $exists: true },
            'users.2': { $exists: false }
        }
});

// Sort the users array before saving
MatchSchema.pre<IMatch>("save", async function (next) {
    if (this.isModified("users") || this.isNew) {
        this.users.sort((a, b) => a.toString().localeCompare(b.toString()));
    }
    next();
})

export default mongoose.model<IMatch>("Match", MatchSchema);
