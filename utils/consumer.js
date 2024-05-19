import mongoose from "mongoose";
import csvProcessModel from "../models/csv-uploads.js";
import userListModel from "../models/user-list.js";
import userModel from "../models/user.js";

export default async function addUsersconsumer({message}){
    try{
        const {data, listId, uploadProcessId} = JSON.parse(message.value);

        let userList = await userListModel.findById(listId);

        console.log('got a chunk');

        let successCount =0, failedCount =0;
        const failedRecords = [];

        await Promise.allSettled(data.map(async(record) => {
            try{
                const userAlreadyExist = await userModel.findOne({email: record.email});

                if(userAlreadyExist){
                    failedCount++;
                    failedRecords.push({
                        data: record,
                        reason: 'Duplicate Email'
                    })
                    return;
                }

                const customProperties = {};
    
                for(const key of userList.customProperties.keys()){
                    customProperties[key] = record[key] ?? userList.customProperties.get(key)
                }

                await userModel.create({
                    email: record.email,
                    name: record.name,
                    customProperties
                });

                successCount++;
            }
            catch(err){
                failedCount++;
                failedRecords.push({
                    data: record,
                    reason: 'duplicate email'
                })
            }
        }))


        const session = await mongoose.startSession();
        session.startTransaction();

        await csvProcessModel.findByIdAndUpdate(uploadProcessId, {
            $inc: {
                successCount,
                failedCount,
                processedCount: data.length
            },
            $push: {
                failedRecords: {$each: failedRecords}
            }
        }, {session})

        await session.commitTransaction();
        session.endSession();

    }
    catch(err){
        console.log('Error in consumer while processing csv records',err);
    }

}