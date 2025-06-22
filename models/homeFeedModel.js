const pool = require('../database/db');
const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
const  {BatchGetCommand, DynamoDBDocumentClient, PutCommand, DeleteCommand, UpdateCommand} = require('@aws-sdk/lib-dynamodb');


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
const LIKES_TABLE = process.env.AWS_DYNAMODB_LIKES_TABLE;

//initialize dynamodb client
const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});


//Initialize DynamoDB Doc client
const docClient =  DynamoDBDocumentClient.from(dynamoDBClient);


//query current user data from users table based on the user_id
const getUserData = async(user_id) => {
 
    const data = await pool.query(
        `SELECT * FROM users WHERE user_id = $1`,
        [user_id]
    );

    if(data.rows.length === 0){
        return null;
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
const getPosts = async(followee_ids, university_name, current_userId) => {

    //check if the user is following any other users
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

    //adding the university placeholder
    values.push(university_name);
    const uniPlaceHolder = `$${values.length}`
    conditions.push(`p.university_name = ${uniPlaceHolder}`);


    //add the current user to exclude it from showing their own posts
    values.push(current_userId);
    const userPlaceHolder = `$${values.length}`;
    const excludeConditions = `p.user_id != ${userPlaceHolder}`;

    
    query += `
     WHERE (${conditions.join(' OR ')}) AND ${excludeConditions}
     ORDER BY p.created_at DESC
     LIMIT 20
    `

    const result = await pool.query(query, values);

    const posts = result.rows;

    //extracts the post ids only
    const postIds = posts.map(post => post.post_id.toLowerCase());


    //fetch all the likes and comments for each post
    const fetchLikesComments = await getPostStatsFromDynamoDB(postIds);
    const likedPost = await getUserLikedPost(current_userId, postIds);


    //merge the likes and comments with its post and returns it
    const mergePost = posts.map(post => ({
       ...post,
       likes: fetchLikesComments[post.post_id]?.likes || 0,
       comments: fetchLikesComments[post.post_id]?.comments || 0,
       hasLiked: likedPost.has(post.post_id)
    }));

    return mergePost;
}




//fetches all the likes and comments count for each postId.
const getPostStatsFromDynamoDB = async (postIds) => {
    if (postIds.length === 0) return {};

    const keys = postIds.map(id => ({ post_id: id  }));

    const params = {
        RequestItems: {
            [TABLE_NAME]: {
                Keys: keys,
                ProjectionExpression: "post_id, comments, likes"
            }
        }
    };

    try {
        const command = new BatchGetCommand(params);
        const response = await docClient.send(command);

        const stats = {};
        for (const item of response.Responses[TABLE_NAME]) {
            const postId = item.post_id.toLowerCase();
            stats[postId] = {
                likes: item.likes || 0,
                comments: item.comments || 0
            };
        }

        return stats;
    } catch (error) {
        console.error("Error fetching DynamoDB stats:", error);
        return {};
    }
};



/**
 * Fetched all the post from postIds that are liked by the user_id
 * @param {*} user_id 
 * @param {*} postIds 
 * @returns set of post that are liked by the user from postIds
 */
const getUserLikedPost = async(user_id, postIds) => {

    if(postIds.length === 0 ) return new Set();

    //maps each post_id with the user_id
    const keys = postIds.map(id => ({
        PK: `USER#${user_id}`,
        SK: `POST#${id.toLowerCase()}`,
    }));
   
    console.log("Checking likes for user:", user_id, "posts:", postIds);

    const params = {
        RequestItems : {
            [LIKES_TABLE]: {
              Keys: keys,
              ProjectionExpression: "SK"
            }
        }
    };


    try{
        const command = new BatchGetCommand(params);
        const response = await docClient.send(command);

       console.log("Liked posts response from DynamoDB:", JSON.stringify(response, null, 2));
        let likedPosts = new Set();
        const items = response.Responses?.[LIKES_TABLE] || [];
        for(const item of items){
            const post_id = item.SK.replace("POST#", "").toLowerCase();
            likedPosts.add(post_id);
        }

        return likedPosts;
    }catch(error){
       console.log("error fetching likes post ", error);
       return new Set();
    }
}




/**
 * Add likes if a user likes a post
 * @param {String} user_id 
 * @param {String} post_id 
 */
const addLikes = async(user_id, post_id) => {

  await docClient.send(new PutCommand({
    TableName: LIKES_TABLE,
    Item: {
        PK: `USER#${user_id}`,
        SK: `POST#${post_id.toLowerCase()}`
    },
    ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
  }));

  console.log(`User ${user_id} liked post ${post_id}`);
  await incrementLikesCount(post_id.toLowerCase());
}


/**
 * Deletes a like if a user unlike a post
 * @param {*} user_id 
 * @param {*} post_id 
 */
const deleteLikes = async(user_id, post_id) => {
    
    await docClient.send(new DeleteCommand({
        TableName: LIKES_TABLE,
        Key: {
            PK: `USER#${user_id}`,
            SK: `POST#${post_id.toLowerCase()}`
        }
    }));

    console.log(`User ${user_id} unliked post ${post_id}`);
    await decrementLikesCount(post_id.toLowerCase());
}



/**
 * Increments the like count of a post if a user likes a post
 * @param {String} post_id 
 */
const incrementLikesCount = async(post_id) => {

    await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME, 
        Key: {post_id : post_id},
        UpdateExpression: "ADD likes :inc",
        ExpressionAttributeValues: {
            ":inc" : 1,
        }
    }));
}


/**
 * Decrement the likes count if a user unlike a post
 * @param {String} post_id 
 */
const decrementLikesCount = async(post_id) => {

    await docClient.send(new UpdateCommand ({
        TableName: TABLE_NAME,
        Key: {post_id : post_id},
        UpdateExpression: "ADD likes :dec",
        ConditionExpression : "attribute_exists(likes) AND likes > :zero",
        ExpressionAttributeValues: {
            ":dec" : -1,
            ":zero" : 0
        } 
    }));
}


module.exports = {
    getUserData,
    getAllFollowees,
    getPosts,
    addLikes,
    deleteLikes,
    incrementLikesCount,
    decrementLikesCount
}
