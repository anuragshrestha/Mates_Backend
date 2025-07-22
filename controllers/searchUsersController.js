const {searchUser} = require('../models/searchUsersModel');

const searchName = async(req, res, next) => {

    const {query, limit = 10, offset = 0} = req.query;
     
    const currentUserId = req.user?.username;

    try{

       if(!query || query.trim() === ''){
        return res.status(400).json({success: false, error: 'Missing query parameter'});
       }

        const users = await searchUser(query, parseInt(limit), parseInt(offset), currentUserId);
        console.log(`found the user: ${users}`);
        
        res.status(200).json({success: true, users});
    }catch(error){
        next(error)
    }
};

module.exports = {
    searchName
}