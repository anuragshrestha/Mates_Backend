const pool = require('../database/db');

require("dotenv").config();


const getUserData = async(userId) => {

    try{
        const result  = await pool.query(
            `SELECT email, full_name 
             FROM users 
             WHERE user_id = $1
            `, [userId]
        );

        const full_name = result.rows[0].full_name;
        const email = result.rows[0].email;
       
        console.log("sucessfully queried user name and email");
        
        return {full_name, email};

    }catch(error){
        console.error("failed to query user data: ", error.message)
    }
}


module.exports = {
    getUserData
}