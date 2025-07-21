const pool = require("../database/db");
const {
  getPostStatsFromDynamoDB,
  getUserLikedPost,
} = require("./homeFeedModel");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");

require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Fetched all the user posts from post table,
 * its like and comment counts from DynamoDB table and
 * checks if the user has liked the post.
 * @param {*} userId
 * @param {*} limit
 * @param {*} offset
 * @returns posts of given limit
 */
const fetchUserPost = async (userId, limit, offset) => {
  try {
    const result = await pool.query(
      `
            SELECT post_id, media_urls, created_at, status
             FROM posts 
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3
            `,
      [userId, limit, offset]
    );

    // console.log("Fetched posts from DB:", result.rows);
    const posts = result.rows;

    if (posts.length === 0) return [];

    const postIds = posts.map((post) => post.post_id.toLowerCase());

    //fetches the likes and comment counts for each post
    // and all the post that the user has liked
    const [fetchLikesComments, likedPost] = await Promise.all([
      getPostStatsFromDynamoDB(postIds),
      getUserLikedPost(userId, postIds),
    ]);

    //merge each post with its likes, comment counts.
    const mergePost = posts.map((post) => ({
      ...post,
      likes: fetchLikesComments[post.post_id]?.likes || 0,
      comments: fetchLikesComments[post.post_id]?.comments || 0,
      hasLiked: likedPost.has(post.post_id),
    }));

    return mergePost;
  } catch (error) {
    throw new Error(`Error fetching user posts: ${error.message}`);
  }
};

/**
 * Fetches the user personal info from users table
 * @param {} userId
 * @returns user data such as name, email, major etc
 */
const fetchUserData = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT * FROM users
      WHERE user_id = $1`,
      [userId]
    );

    const data = result.rows[0];

    return data;
  } catch (error) {
    console.error("failed to fetch user data: ", error);
    throw new Error(`Error fetching user data: ${error.message}`);
  }
};

/**
 * Extacts the followers count, following count and post count
 * of the user
 * @param {String} user_id
 * @returns {object} followersCount, followingCount, postsCount
 */
const fetchUserCounts = async (user_id) => {
  let [followersRes, followingRes, postsRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM follows WHERE followee_id = $1`, [
      user_id,
    ]),
    pool.query(`SELECT COUNT(*) FROM follows WHERE follower_id = $1`, [
      user_id,
    ]),
    pool.query(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, [user_id]),
  ]);

  return {
    followersCount: parseInt(followersRes.rows[0].count),
    followingCount: parseInt(followingRes.rows[0].count),
    postCount: parseInt(postsRes.rows[0].count),
  };
};



/**
 * Checks if the file exits, if so then update the image
 * otherwise, updates other data
 * @param {*} user_id 
 * @param {*} full_name 
 * @param {*} bio 
 * @param {*} major 
 * @param {*} school_year 
 * @param {*} file 
 */
const updateUserData = async (
  user_id,
  full_name,
  bio,
  major,
  school_year,
  file
) => {
  try {
    if (file) {
      const result = await pool.query(
        `SELECT profile_image_url FROM users WHERE user_id = $1`,
        [user_id]
      );

      const image_url = result.rows[0]?.profile_image_url;
      if (!image_url) {
        throw new Error("Profile image URL not found for user.");
      }

      const key = image_url.split("amazonaws.com/")[1];

      const updateCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      });

      await s3.send(updateCommand);
    }

    await pool.query(
      `UPDATE users 
         SET full_name = $1, 
           bio = $2,
           major = $3,
           school_year = $4   
          WHERE user_id = $5     
        `,
      [full_name, bio, major, school_year, user_id]
    );
  } catch (error) {
    console.error("Error in updateUserData function: ", error);
    throw new Error("Failed to update user data.");
  }
};

module.exports = {
  fetchUserPost,
  updateUserData,
  fetchUserData,
  fetchUserCounts,
};
