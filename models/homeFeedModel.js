const pool = require('../database/db');
const {BatchGetItemCommand, DynamoDBClient} = require('@aws-sdk/client-dynamodb');
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



const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE_NAME;

//initialize dynamodb client
const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});


//query current user data from users table based on the user_id
const getUserData = async(user_id) => {
 
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
 * Query latest 20 posts including the poster full name and image_url from posts 
 * table based on the followee_id list and university_name. 
 * Then fetch the likes and comments count for each post, merge it and returns 
 * all the 20 posts
*/


const getPosts = async(followee_ids, university_name) => {

    //check if teh user is following any other users
    const hasFollowee = followee_ids.length > 0;
    

    //query all the post and the full name, image url if the poster user id matches with the user id in users table
    let query = `
     SELECT p.*, u.full_name, u.profile_image_url
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

    const posts = result.rows;

    //extracts the post ids only
    const postIds = posts.map(post => post.post_id);


    //fetch all the likes and comments for each post
    const fetchLikesComments = await getPostStatsFromDynamoDB(postIds);


    //merge the likes and comments with its post and returns it
    const mergePost = posts.map(post => ({
       ...post,
       likes: fetchLikesComments[post.post_id]?.likes || 0,
       comments: fetchLikesComments[post.post_id]?.comments || 0
    }));

     console.log(JSON.stringify(mergePost, null, 2));
    return mergePost;
}




//fetches all the likes and comments count for each postId.
const getPostStatsFromDynamoDB = async (postIds) => {
    if (postIds.length === 0) return {};

    const keys = postIds.map(id => ({ post_id: { S: id } }));

    const params = {
        RequestItems: {
            [TABLE_NAME]: {
                Keys: keys,
                ProjectionExpression: "post_id, comments, likes"
            }
        }
    };

    try {
        const command = new BatchGetItemCommand(params);
        const response = await dynamoDBClient.send(command);

        const stats = {};
        for (const item of response.Responses[TABLE_NAME]) {
            const postId = item.post_id.S;
            stats[postId] = {
                likes: item.likes ? parseInt(item.likes.N) : 0,
                comments: item.comments ? parseInt(item.comments.N) : 0
            };
        }

        return stats;
    } catch (error) {
        console.error("Error fetching DynamoDB stats:", error);
        return {};
    }
};



module.exports = {
    getUserData,
    getAllFollowees,
    getPosts
}
