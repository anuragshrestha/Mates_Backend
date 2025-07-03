const pool = require("../database/db");
const { getPostStatsFromDynamoDB, getUserLikedPost } = require("./homeFeedModel");

require('dotenv').config();



/**
 * Fetched all the user posts from post table, 
 * its like and comment counts from DynamoDB table and
 * checks if the user has liked the post.
 * @param {*} userId 
 * @param {*} limit 
 * @param {*} offset 
 * @returns posts of given limit
 */
const fetchUserPost = async(userId, limit, offset) => {

    try{

        const result = await pool.query(`
            SELECT post_id, media_urls, created_at, status
             FROM posts 
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3
            `, [userId, limit, offset]);

        const posts = result.rows;

        if (posts.length === 0) return [];

        
        const postIds = posts.map(post => post.post_id.toLowerCase());

        //fetches the likes and comment counts for each post
        // and all the post that the user has liked
        const [fetchLikesComments, likedPost] = await Promise.all([
            getPostStatsFromDynamoDB(postIds),
            getUserLikedPost(userId, postIds)
        ]);


        const mergePost = posts.map(post => ({
            ...post,
            likes: fetchLikesComments[post.post_id]?.likes || 0,
            comments: fetchLikesComments[post.post_id]?.comments || 0,
            hasLiked: likedPost.has(post.post_id)
        }));

        return mergePost;
    }catch(error){
        throw new Error(`Error fetching user posts: ${error.message}`); 
    }
}

module.exports = {
    fetchUserPost
}
