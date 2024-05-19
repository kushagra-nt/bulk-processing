import mongoose, { Schema } from "mongoose";

const csvUpload = new Schema({
    userListId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    successCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    processedCount: {
        type: Number,
        default: 0
    },
    totalCount: {
        type: Number,
        default: 0
    },
    failedRecords: {
        type: [Schema.Types.Mixed],
        default: []
    }
});

const csvProcessModel=  mongoose.model("csv-uploads", csvUpload);
export default csvProcessModel;