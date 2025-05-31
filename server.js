const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/uploadImageRoutes');


require("dotenv").config();



console.log("Loading routes...");

const app = express();
const port = 4000;

console.log("Setting up middleware...");
app.use(bodyParser.json());

console.log("Registering routes...");
app.use('/', authRoutes);



app.listen(port, '0.0.0.0', () => {
    console.log(`server running on port ${port}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

