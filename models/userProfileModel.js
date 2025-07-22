/**
 * model that extracts other user followers, posts counts, all posts, check if the viewer is
 * following this current user.
 */

const pool = require('../database/db');
const {getUserLikedPost, getPostStatsFromDynamoDB} = require("../models/homeFeedModel");


/**
 * Extacts the followers count, following count and post count
 * of the user
 * @param {String} user_id 
 * @returns {object} followersCount, followingCount, postsCount
 */
const getUserCounts = async(user_id) => {


    const [followersRes, followingRes, postsRes] = await Promise.all([
       pool.query(`SELECT COUNT(*) FROM follows WHERE followee_id = $1`, [user_id]),
       pool.query(`SELECT COUNT(*) FROM follows WHERE follower_id = $1`, [user_id]),
       pool.query(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, [user_id])       
    ]);

    return {
        followersCount : parseInt(followersRes.rows[0].count),
        followingCount: parseInt(followingRes.rows[0].count),
        postCount: parseInt(postsRes.rows[0].count)
    }
}


/**
 * Checks if the viewer is following the targetUser and vice-versa
 * @param {String} viewer_id 
 * @param {String} targetUserId 
 * @returns isFollowing and isFollowed status
 */
const getFollowStatus = async(viewer_id, targetUserId) => {

    const [followingRes, followedRes] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND followee_id = $2`, [viewer_id, targetUserId]),
        pool.query(`SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND followee_id = $2`, [targetUserId, viewer_id])
    ]);

    return {
        isFollowing : parseInt(followingRes.rows[0].count) > 0,
        isFollowed : parseInt(followedRes.rows[0].count) > 0
    }
}



const getUserPosts = async(viewer_id, targetUserId) => {

    const results = await pool.query(`
        SELECT post_id, media_urls, created_at, status
        FROM posts
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 4` 
        ,
        [targetUserId]);

    const posts = results.rows;

    //stores all the post ids
    const postIds = posts.map(post => post.post_id.toLowerCase());

    const postStats = await getPostStatsFromDynamoDB(postIds);
    const likedPosts = await getUserLikedPost(viewer_id, postIds);

    const mergePosts = posts.map(post => ({
        ...post,
        likes: postStats[post.post_id]?.likes || 0,
        comments: postStats[post.post_id]?.comments || 0,
        hasLiked: likedPosts.has(post.post_id)
    }));

    return mergePosts;
}


module.exports = {
    getUserCounts,
   getFollowStatus,
   getUserPosts
}