/***
 * import express, jsonwebtoken,
 * import all the aws command from @aws-sdk/client-cognito-identity-provider
 * initalize a router
 * get the access key, screct access key, client id
 * initialize the aws config
 *
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const pool = require("../database/db");

require("dotenv").config();

//initialze router
const router = express.Router();

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

//initialize the AWS config
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
};

//creates instance of Cognito client to send the request to Amazon Cognito User pool
const cognitoClient = new CognitoIdentityProviderClient(awsConfig);


/**
 * post: /signup route
 * the client sends, University name, major, school year, first and last name,
 * email (must be .edu email) and password.
 * send the paramaters to the cognito client.
 */
router.post('/signup', async (req, res) => {

    console.log("req:", req);
    
  //data that we get from the body
  const {
    university_name,
    major,
    school_year,
    first_name,
    last_name,
    username,
    password,
  } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;

  

  //verify if the email is a valid school email address
  if (!emailRegex.test(username)) {
    return res
      .status(400)
      .json({ message: "Email must be a valid school email address" });
  }

  const full_name = `${first_name} ${last_name}`;

  const params = {
    ClientId: CLIENT_ID,
    Username: username, //actual .edu email
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: username,
      },
      {
        Name: "name",
        Value: full_name,
      },
    ],
  };

  try {
    
    //checks if the user already exits in database.
    const exitingUser = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [username]
    );
    
    if (exitingUser.rows.length > 0){
      return res.status(409).json({
        success: false,
        message: "User already registered in database."
      })
    };

    //writting new SignUp command
    const command = new SignUpCommand(params);
    console.log("command: ", command);

    //sending the actual command to AWS Cognito using Client.
    const result = await cognitoClient.send(command);

    //Inserts into the users table
    await pool.query(
      `INSERT INTO users (email, full_name, university_name, major, school_year)
       VALUES ($1, $2, $3, $4, $5)`,
       [username,full_name,university_name,major,school_year]
    );

    res.json({ success: true, message: "User Signup successfully", result });
  } catch (error) {
    if (error.name === 'UsernameExitsException'){
      return res.status(409).json({
        success: false,
        message: "This email adress already exits."
      })
    }
    res.status(400).json({
      success: false,
      message: "Failed to Signup the user",
      error: error.message,
    });
  }
});


module.exports = router;