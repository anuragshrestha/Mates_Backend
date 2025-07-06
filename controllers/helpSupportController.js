const { text } = require('express');
const { getUserData } = require('../models/feedbackModel');
const nodemailer = require('nodemailer');


require("dotenv").config();

const sendHelpEmail = async(req, res) => {

    const userId = req.user?.username;
    const {email, message} = req.body;

   if(!userId) return res.status(400).json({success: false, error: 'user not authenticated'});

    if(!email || !message){
        return res.status(400).json({success: false, error: "all fields are required"});
    }

    try{
        const result = await getUserData(userId);
        const actualEmail = result.email;
        const full_name = result.full_name;
       
       const transpoter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.FEEDBACK_EMAIL,
            pass: process.env.FEEDBACK_EMAIL_PASSWORD
        }
       });

        const mailOptions = {
            from: process.env.MY_EMAIL,
            to: process.env.FEEDBACK_EMAIL,
            subject: 'New Help & Support From Mates App',
            text: `Below is the help and support needed: \n\nName: ${full_name}\n\nContact Email: 
               ${email}\n\nUser email: ${actualEmail}\n\nHelp and Support: ${message}`
        }

        await transpoter.sendMail(mailOptions);

        console.log('successfully sended help and support');
        
        return res.status(200).json({success: true, message: 'successfully send help mail'})

    }catch(error){
        console.error('failed to send help and support email: ', error);
        return res.status(500).json({success: false, error: error.message});
    }
} 

module.exports = {sendHelpEmail}