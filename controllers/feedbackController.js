const { text } = require('express');
const nodemailer = require('nodemailer');
const {getUserData} = require("../models/feedbackModel");

require("dotenv").config();


const sendFeedback = async(req, res) => {

    const userId = req.user?.username;
    const {message} = req.body;

    if(!userId) return res.status(400).json({success: false, error: "user id is undefined"})

    if(!message){
        return res.status(400).json({success: false, error: 'message is required'});
    }

    try{
      
        const data = await getUserData(userId);
        const name = data.full_name;
        const email = data.email;


        const transpoter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.FEEDBACK_EMAIL,
                pass: process.env.FEEDBACK_EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.FEEDBACK_EMAIL,
            to: process.env.MY_EMAIL,
            subject: "New Feedback From Mates App",
            text: `Feedback is below:\n\nName: ${name}\n\nEmail: ${email}\n\n\nFeedback: ${message}`
        }

        await transpoter.sendMail(mailOptions);
        console.log("successfully send the feedback");

        return res.status(200).json({succ: true, message: "Successfully send feedback"});
    }catch(error){
        console.error("failed to send feedback: ", error);
        return res.status(500).json({success: false, error: error.message});
    }
}

module.exports = {
    sendFeedback
}