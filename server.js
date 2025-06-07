const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/uploadPostRoute');
const redis = require('ioredis');

require("dotenv").config();



console.log("Loading routes...");

const app = express();
const port = process.env.PORT || 4000;

console.log("Setting up middleware...");
app.use(bodyParser.json());

console.log("Registering routes...");
app.use('/', authRoutes);


//route for uploading post
app.use('/', postRoutes);


const redisClient = new redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});


app.get('/', async (req, res) => {
  const cached = await redisClient.get('ping');
  if (cached) return res.send(`Cache hit: ${cached}`);

  await redisClient.set('ping', 'pong', 'EX', 60);
  res.send('Cache miss: pong');
});


app.listen(port, '0.0.0.0', () => {
    console.log(`server running on port ${port}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

