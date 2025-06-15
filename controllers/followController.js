
const {followUser} = require('../models/followModel');



/**
 * Calls teh followUser model and tries to follow the followee_id
 * @param {String} followee_id
 * @param {*} res 
 * @returns {Object}  {success: bool, message: String}
 */
const follow = async(req, res) => {

    //retrives the follower_id from jwt
    const follower_id = req.user?.username

    const followee_id = req.body.followee_id;


    //checks if both the follower_id and followee_id are provided
    if(!follower_id || !followee_id){
        console.log('Both follower and followe ids are required');  
        return res.status(400).json({success: false, error: "Both follower and followe id's are required"})
    }


    //checks if the user tries to follow themself
    if(follower_id === followee_id){
        console.log('User canot follow themself');  
        return res.status(400).json({success:false, error: "User can't follow themself"})
    }

    try{
        const response = await followUser(follower_id, followee_id);
        if(response.success){
            return res.status(200).json({success: true, message: "Successfully followed"});
        }else{
            return res.status(500).json({success: false, message: response.message || response.error})
        }
    }catch(error){

        return res.status(500).json({success: false, error: error.message})
    }
}



module.exports = {
    follow
}