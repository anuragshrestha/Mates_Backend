const pool = require('../database/db');
const {GetItemCommand, DynamoDBClient} = require('@aws-sdk/client-dynamodb');
const {GetObjectCommand, S3Client, S3} = require('@aws-sdk/client-s3');
const getUserEmail = require('../utils/getCognitoUserEmail');


require('dotenv').config();


/**
 * Initialzie s3 and dynamodb client
 * Extracts the user id and get the user email
 * query user data from users table
 * query all followee_id from follows table
 * query 20 post based on university_name and followee_id from post table
 * query users image_url and full_name from users table whose post we just extracted
 * return it.
*/

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;


//Initialize AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});


//initialize dynamodb client
const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});


//query current user data from users table based on the user_id
const userData = async(user_id) => {
 
    const data = await pool.query(
        `SELECT * FROM users WHERE user_id = $1`,
        [user_id]
    );

    if(data.rows.length === 0){
        return 'no user found';
    }

    return data.rows[0];
}


//query all followee_id from follows table
const getAllFollowees = async(user_id) => {

    const result = await pool.query(
        `SELECT followee_id from follows WHERE follower_id = $1`,
        [user_id]
    );

    return result.rows.map(r => r.followee_id);
};

/**
 * query latest 20 posts including the poster full name and image_url from posts 
 * table based on the followee_id list and university_name.
*/


const getPosts = async(followee_ids, university_name) => {

    //check if teh user is following any other users
    const hasFollowee = followee_ids.length > 0;
    

    //query all the post and the full name, image url if the poster user id matches with the user id in users table
    let query = `
     SELECT p.*, u.full_name, u.image_url
     FROM posts p
     JOIN users u ON p.user_id = u.user_id 
    `;

    let values = [];
    let conditions = [];
  
    //checks if there is a followee and if so then creates the placeholders dynamically.
    if(hasFollowee) {
      const placeholders = followee_ids.map((_, i) => `$${i + 1}`).join(', ');
      values.push(...followee_ids);
      conditions.push(`p.user_id IN (${placeholders})`);
    }

    values.push(university_name);
    const uniPlaceHolder = `$${values.length}`
    conditions.push(`p.university_name = ${uniPlaceHolder}`);

    
    query += `
     WHERE ${conditions.join(' OR ')}
     ORDER BY p.created_at DESC
     LIMIT 20
    `

    const result = await pool.query(query, values);

    return result.rows;


}









module.exports = {
    userData,
    getAllFollowees
}
