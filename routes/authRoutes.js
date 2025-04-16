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
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const pool = require("../database/db");
const { Client } = require("pg");

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
 * checks if the user already exits in the database, if so then return error 409.
 * Otherwise, create new accoount using AWS Cognito and saves the user data in `users`
 * table in postgres.
 */

router.post("/signup", async (req, res) => {
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
      .json({error: "Email must be a valid school email address" });
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

    if (exitingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User already registered in database.",
      });
    }

    //writting new SignUp command
    const command = new SignUpCommand(params);
    console.log("command: ", command);

    //sending the actual command to AWS Cognito using Client.
    const result = await cognitoClient.send(command);

    //Inserts into the users table
    await pool.query(
      `INSERT INTO users (email, full_name, university_name, major, school_year)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, full_name, university_name, major, school_year]
    );

    res.json({ success: true, message: "User Signup successfully", result });
  } catch (error) {
    if (error.name === "UsernameExitsException") {
      return res.status(409).json({
        success: false,
        error: "This email adress already exits.",
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || "Failed to Signup the user",
    });
  }
});

/**
 * post: confirm route
 * extracts the username and confirmation code from the request body
 * creates a new confirmation signup command and sends it to cognito
 * if success then return status 200 else 400.
 */

router.post("/confirm-Signup", async (req, res) => {
  //extracts the username and confirmation code from the request body
  const { username, confirmationCode } = req.body;

  //parameters to send to cognito
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
  };

  try {
    //creates new ConfirmationSignup command
    const command = new ConfirmSignUpCommand(params);

    //sends the command to cognito for verification.
    const response = await cognitoClient.send(command);
    console.log("user confirmed successfully.");

    res.json({
      success: true,
      message: "User confirmed successfully",
      data: response,
    });
  } catch (error) {
    console.log(error);
    
    //checks if the code is already expired.
    if (error.name === 'ExpiredCodeException'){
      return res.status(400).json({
        success:false,
        error:"Code is experied. Please request a new code again."
      })
    }

    //checks if the users is already confirmed.
    if (
      error.name === "NotAuthorizedException" &&
      error.message.includes("Current status is CONFIRMED")
    ) {
      return res.status(400).json({
        success: false,
        error: "User is already confirmed. Please log in.",
      });
    }
    res.status(400).json({
      success: false,
      error: error.message || "User can't be confirmed successfully",
    });
  }
});



/**
 * post: resend-confirmationCode
 * extracts the email from request body
 * checks if its a valid .edu school email
 * creates new ResendConfirmationCodeCommand and
 * sends the code to the assocaited email using the 
 * cognito client.
 */

router.post('/resend-confirmation-code', async(req, res) => {

  const {username} = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;
 
  //checks if the email is a valid .edu address
  if(!emailRegex.test(username)){
    res.status(400).json({
      success: false,
      error: "Invalid email. Email address should be .edu address"
    })
  };

  const params = {
    ClientId: CLIENT_ID,
    Username: username
  };

  try{
    const command = new ResendConfirmationCodeCommand(params);
    const response = await cognitoClient.send(command);
    console.log("response", response);
    
    res.status(200).json({
      success: true,
      message: "Successfully send the reset code.",
      data: response
    })
  }catch(error){
    res.status(400).json({
      success: false,
      error: error.message || "Failed to send confirmation code."
    })
  }
});

/**
 * 1) signin : check if the user is not confirmed
 * 2) forgot password
 * 3) confirm - forgot password
 */

/**
 * post: signIn route
 * extracts the username, password from request body
 * Initiate the Auth and send the command to cognito.
 * returns success otherwise checks if the user is already
 * confirmed, or if the provided credentials is invalid.
 */

router.post('/signin', async(req, res) => {
   
  console.log("hit signin api");
  
  const {username, password} = req.body;

  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId : CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  };

  try{
   
    //Initiate new auth command with the given paramters.
    const command = new InitiateAuthCommand(params);

    //send the command to the cognito
    const response = await cognitoClient.send(command);
    res.status(200).json({
      success: true,
      message: "Successfully sign in the user",
      data: response
    });
  }catch(err){
   console.log(('error: ', err));
   
   //checks if the user account is not confirmed.
   if(err.name === 'UserNotConfirmedException'){
     return res.status(403).json({
      success: false,
      error: "Account not confirmed. Please confrimed the account."
     });
   }
   

   //checks if the user email and password is invalid.
   if(err.name === 'NotAuthorizedException'){
    return res.status(401).json({
      success: false,
      error: "Invalid credentials. Please enter valid email or password."
    });
   }
   
    res.status(400).json({
      success: false,
      error: err.message || 'Sign in failed'
    });

  }
});

/**
 * post: resfresh-token route
 * checks if the there is refresh token.
 * if there is a refresh token, then 
 * initiate new auth and returns new access token and id token.
 */
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required."
    });
  }

  const params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken
    }
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);
    console.log("hit refresh token ", response);
    
    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        tokenType: response.AuthenticationResult.TokenType,
        expiresIn: response.AuthenticationResult.ExpiresIn
      }
    });

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Failed to refresh token. Please log in again.",
      error: error.message
    });
  }
});



module.exports = router;
