import express from 'express';
import { setupConsumers } from "./utils/kafka.js";
import userListRouter from './routes/userListRouter.js';
import mongoose from 'mongoose';

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());


app.use('/user-list', userListRouter);

mongoose.connect(process.env.DATABASE_URL)
.then(()=>{
    // kafka consumers
    setupConsumers();
})
.then(()=>{
    app.listen(3000, ()=>{
        console.log('server started on port 3000');
    })
})
.catch((err) => {
    console.log('Error while initial setup',err);
})