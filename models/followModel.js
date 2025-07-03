const pool = require("../database/db");

require('dotenv').config();

/**
 * Querys from follows table and checks if the follower has already
 * followed the followee. If so then it returns True
 * Otherwise, it Inserts the follower_id and followee_id into the follows
 * table.
 * @param {String} follower_id
 * @param {String} followee_id
 * @returns {Object} {success: bool, message: String}
 */
const followUser = async (follower_id, followee_id) => {
  try {
    const alreadyFollowed = await pool.query(
      `SELECT * FROM follows WHERE follower_id = $1 AND followee_id = $2 `,
      [follower_id, followee_id]
    );

    if (alreadyFollowed.rows.length > 0) {
      return { success: false, error: "user was already followed" };
    }

    const didFollow = await pool.query(
      `
            INSERT INTO follows (follower_id, followee_id)
            VALUES ($1, $2)
            RETURNING *
            `,
      [follower_id, followee_id]
    );

    if (didFollow.rows.length > 0) {
      return { success: true, message: "Successfully followed" };
    } else {
      return { success: false, error: "failed to follow" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};




/**
 * 
 * @param {String} follower_id 
 * @param {String} followee_id 
 * @returns {Object} {success: bool, message: String}
 */
const unfollowUser = async (follower_id, followee_id) => {

  try {
    //Query row to check if follower folows followee
    const follows = await pool.query(
      `SELECT * FROM follows WHERE follower_id = $1 AND followee_id = $2`,
      [follower_id, followee_id]
    );

    //if row length is zero, then follower doesnot follows followee.
    if (follows.rows.length === 0) {
      return { success: false, error: "User was not followed" };
    }

    const unfollow = await pool.query(
      `DELETE FROM follows
       WHERE follower_id = $1 AND followee_id = $2
       RETURNING *
      `,
      [follower_id, followee_id]
    );

    if (unfollow.rows.length > 0) {
      return { success: true, message: "Successfully unfollowed" };
    } else {
      return { success: false, error: "Failed to unfollow" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  followUser,
  unfollowUser
};
