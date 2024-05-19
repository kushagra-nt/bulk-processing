import papa from 'papaparse';
import {config} from 'dotenv';
import { producer } from '../utils/kafka.js';
import userListModel from '../models/user-list.js';
import csvProcessModel from '../models/csv-uploads.js';
import userModel from '../models/user.js';

config();

export async function createUserList(req, res){
    try{

        const {name, description, customProperties} = req.body;

        if(!name){
            res.status(400);
            return res.send('Name is required');
        }

        const newUserList = await userListModel.create({
            name,
            description: description || '',
            customProperties: customProperties || {}
        })

        res.json({
            message: 'userlist created succesfully',
            id: newUserList._id
        })
    }
    catch(err){
        res.status(500);
        console.log('error in createUserList, recieved body:', req.body);
        console.log('error in createUserList: ',err);
        res.send('Internal server error');
    }
}

export async function addUser(req,res){
    try{
        const {name, email, userListId, customProperties} = req.body;

        const userList = await userListModel.findById(userListId);

        if(!userList){
            return res.status(400).send('Invalid list id');
        }

        const properties = {};
    
        for(const key of userList.customProperties.keys()){
            properties[key] = customProperties[key] ?? userList.customProperties.get(key)
        }

        const result = await userModel.create({
            name,
            email,
            customProperties: properties,
            listId: userListId
        })
        res.json(result);
    }
    catch(err){
        console.log(err);
        res.status(400);
        res.send('duplicate email');
    }
}

export async function addUsersThroughCsv(req, res){

    try{
        const listId = req.params.listId;

        if(!req.file){
            return res.status(400).send('No csv file found');
        }

        const targetUserList = await userListModel.findById(listId);

        if(!targetUserList){
            res.status(400);
            return res.send('Invalid user-list id');
        }

        const uploadProcess = await csvProcessModel.create({
            userListId: listId,
        })

        // TODO: 1) parse csv and produce messages for it
        let chunk = [];
        let totalCount = 0;
        const CHUNK_SIZE = process.env.CSV_RECORD_CHUNK_SIZE || 500;
        await producer.connect();

        papa.parse(req.file.buffer.toString('utf-8'), {
            header: true,
            step: async(result) => {

                if(!result.data.name || !result.data.email)return;

                chunk.push(result.data);

                if(chunk.length >= CHUNK_SIZE){
                    totalCount += chunk.length;
                    await producer.send({
                        topic: process.env.KAFKA_ADD_USER_TOPIC,
                        messages: [{
                            value: JSON.stringify({
                                data: chunk,
                                listId,
                                uploadProcessId: uploadProcess._id
                            })
                        }]
                    })
                    chunk = [];
                }
            },
            complete: async()=>{
                if (chunk.length > 0) {
                    totalCount += chunk.length;
                    await producer.send({
                      topic: process.env.KAFKA_ADD_USER_TOPIC,
                      messages: [{ value: JSON.stringify({
                        data: chunk,
                        listId,
                        uploadProcessId: uploadProcess._id
                    }) }]
                    });

                    uploadProcess.totalCount = totalCount;
                    await uploadProcess.save();
                }
                await producer.disconnect();
                console.log('CSV file has been processed and sent.');            
            },
            error: async(err)=>{
                // since we had error while parsing csv file so no need to keep an document for its progress
                await csvProcessModel.findByIdAndDelete(uploadProcess._id);
                console.log('error parsing csv', err);
                return res.status(400).send('Error while processing csv file');
            }
        })

        res.json({
            message: `your file is being processed in background, to check its progress hit /user-list/csv-status/${uploadProcess._id}`,
            uploadProcessId: uploadProcess._id
        })
    }
    catch(err){
        res.status(500);
        console.log('error in addUsersThroughCSV, recieved body:', req.body);
        console.log('error in addUsersThroughCSV: ',err);
        res.send('Internal server error');
    }

}

export async function getProcessStatus(req,res){
    try{
        const {uploadProcessId} = req.params;

        const currentStatus = await csvProcessModel.findById(uploadProcessId);

        if(!currentStatus){
            return res.status(400).send('Invalid process id');
        }

        res.json(currentStatus);
    }
    catch(err){
        console.log('error in getProcessStatus', err);
        res.status(500).send('Internal server error');
    }
}