const {
    CognitoIdentityProvider,
    AdminGetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProvider({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});


/**
 * Extracts the user email from cognito base on the username
 * @param {*} username 
 * @returns 
 */
async function getEmailFromUsername(username) {
    
    const command = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username
    });

    const response = await client.send(command);
    console.log('response: ', response);
    const emailAttribute = response.UserAttributes.find(attr => attr.Name === "email");
    return emailAttribute?.Value
    
}

module.exports = getEmailFromUsername;
