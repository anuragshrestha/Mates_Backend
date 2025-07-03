const {fetchUserPost} = require("../models/accountModel");

/**
 * Fetches the posts of the user based on the user_id
 * @param {*} req 
 * @param {*} res 
 * @returns post with limit
 */
const getUserPost = async(req, res) => {

    const userId = req.user?.username;
    const limit = parseInt(req.query.limit) || 9;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!userId){
        return res.status(400).json({
            success: false,
            error: "user id is required"
        });
    }


    try{
          const posts = await fetchUserPost(userId, limit, offset);
          return res.status(200).json({success: true, message: "Successfully fetched post", posts: posts});
    }catch(error){
           console.log('failed to fetched posts: ', error.message);
           return res.status(500).json({success: false, error: error.message});
    }
} 

module.exports = {
    getUserPost
}