const { APIGateway, CognitoIdentityServiceProvider } = require('aws-sdk');

const API = new APIGateway({ region: 'us-east-1' });
const cognito = new CognitoIdentityServiceProvider({ region: 'us-east-1' });

const main = async (event) => {
    console.log('Event: ', event);
    return '';
};
exports.handler = main;
