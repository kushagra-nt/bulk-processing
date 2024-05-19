import { Kafka, logLevel } from 'kafkajs';
import {config} from 'dotenv';
import addUsersconsumer from './consumer.js';

config();

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER],
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
  ssl: true,
  logLevel: logLevel.ERROR,
  connectionTimeout: 3000
});


export const producer = kafka.producer();


export async function setupConsumers(){
  const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP_ID });

  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_ADD_USER_TOPIC });
  console.log('consumer connected sucessfully');

  await consumer.run({
    eachMessage: addUsersconsumer,
  })
}
