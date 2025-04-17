const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');


require("dotenv").config();

const app = express();
const port = 4000;


// parse the body in json
app.use(bodyParser.json());

//Auth routes for Authentication
app.use('/',authRoutes);


app.listen(port, () => {
    console.log(`server running on port ${port}`);
});

