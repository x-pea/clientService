import { config } from 'dotenv';
import Consumer from 'sqs-consumer';
import aws from 'aws-sdk';
import { addNewEntry } from './index';

config();

let queueUrl = process.env.AWS_TESTQ_URL;
if (process.env.NODE_ENV !== 'development') queueUrl = process.env.AWS_CLIENT_URL;

const params = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
};

aws.config.update(params);

const queue = Consumer.create({
  queueUrl,
  batchSize: 10,
  visibilityTimeout: 20,
  terminateVisibilityTimeout: true,
  waitTimeSeconds: 20,
  sqs: new aws.SQS(),
  handleMessage: (message, done) => {
    // insert or update entry
    const listing = JSON.parse(message.Body);
    addNewEntry(listing.city, listing.type, listing, listing.type.slice(0, -1), listing.id)
      .then(() => done())
      .catch(err => done(err));
  },
});

// TODO: remove console messages in favor of log file
queue.on('error', err => console.error('queue error: ', err.message)); // eslint-disable-line
queue.on('stopped', () => console.log('done comsuming noms')); // eslint-disable-line
queue.on('empty', () => console.log('feed me more noms!')); // eslint-disable-line

queue.start();
