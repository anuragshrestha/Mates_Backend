const pool = require('../database/db');

require('dotenv').config();

const searchUser = async(name) => {

    const text = name.toLowerCase();

    
      const result = await pool.query(
        `SELECT *, 
          CASE
           WHEN similarity(full_name, $1) >= 0.2 THEN similarity(full_name, $1)
           ELSE similarity(university_name, $1)
          END AS score
        FROM users
        WHERE (
         full_name ILIKE $1 || '%'  OR
         university_name ILIKE $1 || '%' OR 
         similarity(full_name, $1) >= 0.2 OR
         similarity(university_name, $1) >= 0.2
        )
        ORDER BY
         CASE
          WHEN full_name ILIKE $1 || '%' OR university_name ILIKE $1 || '%' THEN 0
          ELSE 1
         END,
         score DESC
         LIMIT 10;
        `,
        [text]
      );

      return result.rows;
}

module.exports = {
    searchUser
}