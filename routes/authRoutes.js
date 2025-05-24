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
  GlobalSignOutCommand,
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
 * checks if the user already exists in the database, if so then return error 409.
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
    //checks if the user already exists in database.
    const exitingUser = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [username]
    );

    if (exitingUser.rows.length > 0) {
      console.log("users already exists in database");
      
      return res.status(409).json({
        success: false,
        error: "Email already registered",
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
    if (error.name === "UsernameExistsException") {
      console.log("User already exits in cognito.");
      
      return res.status(409).json({
        success: false,
        error: "Account already created",
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

  const user = await pool.query("SELECT * FROM users WHERE email = $1", [username]);
  if (user.rows.length === 0){
    return res.status(404).json({success: false, error: "User not found"})
  }

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
    console.log("response: ", response);

    const {AuthenticationResult} = response;
    
    res.status(200).json({
      success: true,
      message: "Successfully sign in the user",
      accessToken: AuthenticationResult.AccessToken,
      idToken: AuthenticationResult.IdToken,
      refreshToken: AuthenticationResult.RefreshToken,
      expiresIn: AuthenticationResult.ExpiresIn,
      tokenType: AuthenticationResult.TokenType
    });
  }catch(err){
   console.log(('error: ', err));
   
  // User has not confirmed their account
  if (err.name === 'UserNotConfirmedException') {
    return res.status(403).json({
      success: false,
      error: 'Account not confirmed'
    });
  }

  // Incorrect username or password
  if (err.name === 'NotAuthorizedException') {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
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


/**
 * post: forgot-password
 * extracts the email and check if it's a vaid school email.
 * If it is then it creates a new command for forgot password and
 * send it to cognito. 
 * After that, the user recieves a reset code.
 */

router.post('/forgot-password', async(req, res) => {
  
  console.log('hit forgot password api');
  
  const {username} = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;
  
  //checks if the email is a valid school email: .edu
  if(!emailRegex.test(username)){
    return res.status(400).json({
      success: false,
      error: 'Invalid email format. Please provide a valid school email.'
    })
  };

  const params = {
    ClientId : CLIENT_ID,
    Username: username 
  };

  try{
    //create new command for ForgotPassword.
    const command = new ForgotPasswordCommand(params);

    //send the command to cognito
    const response = await cognitoClient.send(command);
    res.status(200).json({
      success: true,
      message: 'Successfully send the code for forgot password.',
      data: response
    });
  }catch(err){
     res.status(500).json({
      success: false,
      error: err.message || 'Failed to send forgot password code.'
     })
  }
});


/**
 * post: confirm-forgot-password
 * extracts the email, confirmation code and password from
 * the request body. 
 * check if none of them is empty.
 * creates new command for confirmForgotPassword and send the 
 * command to AWS Cognito. If success it returns status code: 200
 * else status code: 400 
 */


router.post('/confirm-forgot-password', async(req, res) => {

  const {username, confirmationCode, password} = req.body;
  
  console.log('hit confirm forgot password', username, confirmationCode, password);
  
  //checks if either of the input is empty
  if(!username || !confirmationCode || !password){
    return res.status(400).json({
      success: false,
      error: 'Either email, confirmation code or password is empty.'
    });
  }
 
  const params = {
    ClientId : CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
    Password: password
  };

  try{
    const command = new ConfirmForgotPasswordCommand(params);

    //send the command to AWS cognito
    const response = await cognitoClient.send(command);
    res.status(200).json({
      success: true,
      message: 'Successfully reset password',
      data: response
    });
  }catch(err){
    console.log("error: ", err);
    
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to reset password.'
    });
  }
});


/**
 * post: signout route
 * Extracts the accessToken and checks if its not empty.
 * create new command for Signout and sends to AWS Cognito.
 * If success, it sign out the user else returns the appropriate
 * error.
 */

router.post('/signout', async(req, res) => {

  const authHeader = req.headers['authorization'];
  const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;


  console.log('hit signout api');
  

  //checks if access token is empty
  if(!accessToken){
    return res.status(400).json({
      success: false,
      error: 'Please provide access token'
    });
  }

  const params = {
    ClientId : CLIENT_ID,
    AccessToken: accessToken
  };
  
  try {
    const command = new GlobalSignOutCommand(params);
    const response = await cognitoClient.send(command);

    res.status(200).json({
      success: true,
      message: 'User successfully signed out.',
      data: response
    });
  }catch(err){
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to signedout user.'
    });
  }
  
});





module.exports = router;
