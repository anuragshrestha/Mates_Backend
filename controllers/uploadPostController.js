/**
 * - set up s3, dynamodb
 * store the image in s3
 * store the meta data in postgres table for post and comments
 * store the meta data in dynamodb
 *
 *
 */

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { PutItemCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const getUserEmail = require("../utils/getCognitoUserEmail");
const pool = require("../database/db");
const { v4: uuidv4 } = require("uuid");
const redisClient = require("../utils/redis");

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
        const mediaKey = `${user.university_name}/${email}/${post_id}_${uuidv4()}.${ext}`;
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
            type: file.mimetype.startsWith("image") ? "image" : "video"
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

    return res.status(200).json({ success: true, postId: post_id });
  } catch (error) {
    console.error("Error creating a new post ", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPost,
};
