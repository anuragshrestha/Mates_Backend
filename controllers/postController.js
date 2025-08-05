const { PutObjectCommand, S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { PutItemCommand, DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const getUserEmail = require("../utils/getCognitoUserEmail");
const pool = require("../database/db");
const { v4: uuidv4 } = require("uuid");
const redisClient = require("../utils/redis");
const { json } = require("express");

require("dotenv").config();

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

//Initialize AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

//Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const createPost = async (req, res) => {
  const { status } = req.body;
  const username = req.user?.username?.trim();
  console.log("username: ", username);

  const email = req.user?.email || (await getUserEmail(username));
  const post_id = uuidv4();
  const comment_id = uuidv4();
  const image = req.file;
  const createdAt = new Date().toISOString();
  const files = req.files;

  const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  const user = userResult.rows[0];
  let mediaUrls = [];

  try {
    if (!process.env.AWS_POST_BUCKET_NAME) {
      throw new Error(
        "AWS_POST_BUCKET_NAME environment variable is not defined"
      );
    }

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.originalname.split(".").pop();
        const mediaKey = `${
          user.university_name
        }/${email}/${post_id}_${uuidv4()}.${ext}`;
        let mediaUrl = null;

        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_POST_BUCKET_NAME,
            Key: mediaKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read",
          })
        );
        mediaUrl = `http://${process.env.AWS_POST_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${mediaKey}`;
        mediaUrls.push({
          url: mediaUrl,
          type: file.mimetype.startsWith("image") ? "image" : "video",
        });
      }
    }

    //stored the post metadata in posts table.
    await pool.query(
      `INSERT INTO posts (post_id, email, media_urls, created_at, status, user_id, university_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING*`,
      [
        post_id,
        email,
        JSON.stringify(mediaUrls),
        createdAt,
        status,
        username,
        user.university_name,
      ]
    );

    //stored the post meta data in DynamoDB
    await dynamodb.send(
      new PutItemCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Item: {
          post_id: { S: post_id },
          likes: { N: "0" },
          comments: { N: "0" },
        },
        ConditionExpression: "attribute_not_exists(post_id)",
      })
    );

    //delete the cache for user profile
    await redisClient.del(`targetUser:${username}`);

    console.log("Successfully created and stored the post ", post_id);

    return res.status(200).json({ success: true, message: 'Successfully created the post' });
  } catch (error) {
    console.error("Error creating a new post ", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};




/**
 * updated the status of a specific post
 * @param {*} req 
 * @param {*} res 
 * @returns bool, message
 */
const updatePost = async (req, res) => {

  const user_id = req.user?.username?.trim();
  const { status } = req.body;
  const post_id = req.params.postId;

  if (!status)
    return res
      .status(400)
      .json({ success: false, error: "Status is required" });

  try {
    const result = await pool.query(
      `SELECT user_id FROM posts WHERE post_id = $1`,
      [post_id]
    );

    console.log("result: ", result);
    
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, error: "No post found" });


    //checks if the userId matches with the id of the post
    if (result.rows[0].user_id != user_id)
      return res
        .status(403)
        .json({ success: false, error: "unauthorized user" });


    //query to update the post
    await pool.query(
      `
      UPDATE posts SET status = $1 WHERE post_id = $2`,
      [status, post_id]
    );

    console.log("successfully updated post");
    return res
      .status(200)
      .json({ success: true, message: "Successfully updated post" });
  } catch (error) {
    console.log("failed to update the post ", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};


const deletePost = async(req, res) => {

  const user_id = req.user?.username?.trim();
  const postId = req.params.postId;

  try{

    const result = await pool.query(`SELECT user_id, media_urls FROM posts WHERE post_id = $1`, [postId]);

    if(result.rowCount === 0) return res.status(404).json({success: false, error: "No post found"});

    if(result.rows[0].user_id != user_id) return res.status(403).json({success: false, error: "unathorized user"});

    let mediaUrls = result.rows[0].media_urls;
    console.log("result: ", result);
    
    if(typeof mediaUrls === 'string'){
      mediaUrls = JSON.parse(mediaUrls);
      console.log('its a string type');
    }
     mediaUrls = mediaUrls || [];

    //Deletes the posts with post_id from the posts table 
    await pool.query(
      `DELETE FROM posts WHERE post_id = $1`,
      [postId]
    );

    //map each media and stores its key
    const objectKeys = mediaUrls.map(media => ({
        Key: media.url.split(`amazonaws.com/`)[1]
    }));


    //Delete all the media from the S3 if exits
    if(objectKeys.length > 0){
      await s3.send(
          new DeleteObjectsCommand({
            Bucket: process.env.AWS_POST_BUCKET_NAME,
            Delete:{
            Objects: objectKeys
            }
          })
        );
    }
 

    //Deletes the like/comment counts from DynamoDB
    await dynamodb.send(
      new DeleteItemCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Key: {post_id: {S: postId}}
      })
    );

     console.log('successfully deleted the post');
     return res.status(200).json({success: true, message: 'Successfully deleted post'})
     
  }catch(error){

     console.log('failed to delete the post ', error.message);   
     return res.status(500).json({success: false, error: error.message});
  }
}






module.exports = {
  createPost,
  updatePost,
  deletePost
};
