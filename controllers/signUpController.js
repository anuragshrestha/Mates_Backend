const pool = require('../database/db');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const {SignUpCommand, CognitoIdentityProviderClient} = require("@aws-sdk/client-cognito-identity-provider")
const {v4: uuidv4} = require('uuid');
const id = uuidv4();



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

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }

});



const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heif']


/**
 * post: /signup route
 * the client sends, University name, major, school year, first and last name,
 * email (must be .edu email) and password.
 * checks if the user already exists in the database, if so then return error 409.
 * Otherwise, create new accoount using AWS Cognito and saves the user data in `users`
 * table in postgres.
 */
exports.signupUser = async (req, res) => {
    const file = req.file;

    const {
        university_name,
        major,
        school_year,
        first_name,
        last_name,
        username,
        password
    } = req.body;

    const full_name = `${first_name} ${last_name}`;
    const email = username;

   

//    const emailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;

//     //verify if the email is a valid school email address
//     if (!emailRegex.test(username)) {
//         return res
//         .status(400)
//         .json({error: "Email must be a valid school email address" });
//     }

    try {
        const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ success: false, error: "Email already registered" });
        }

        // Send signup to Cognito
        const params = {
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "name", Value: full_name }
            ]
        };
     
        
        if(!file){
            return res.status(400).json({success: false, error: "Profile image is required"})
        }

         if(!allowedTypes.includes(file.mimetype)){
           return res.status(400).json({success: false, error: "Unsupported image type"});
        }


        // Upload image to S3 if present
        let imageUrl = null;
        if (file) {
            const key = `profile_images/${email}.${file.originalname.split('.').pop()}`;
             console.log('image key: ', key);
             
            const uploadCommand = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
                Metadata: {
                    email: email,
                    full_name: full_name
                }
            });
            
            //uploads image to s3
            await s3.send(uploadCommand);

        
            imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        }
        
        //send request to the cognito client
        const command = new SignUpCommand(params);
        const result = await cognitoClient.send(command);

        const user_id = result.UserSub;

        // Store in DB
        await pool.query(
            `INSERT INTO users (user_id, email, full_name, university_name, major, school_year, profile_image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user_id, email, full_name, university_name, major, school_year, imageUrl]
        );

 

        console.log('User signed up successfully: ', result);
        
        res.json({ success: true, message: "User signed up successfully", result });
    } catch (err) {
        if (err.name === "UsernameExistsException") {
            return res.status(409).json({ success: false, error: "Account already created" });
        }
        res.status(500).json({ success: false, error: err.message || "Signup failed" });
    }
};


