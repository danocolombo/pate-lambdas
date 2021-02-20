var AWS = require('aws-sdk');
const crypto = require('crypto');
var dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

exports.handler = async (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    var operation = event.operation;
    let payload = {
        status: '400',
        body: {
            // message: 'Pate System Error',
        },
    };
    let theUser = null;
    var response = '';
    var uData = '';
    event.payload.TableName = 'p8Users';
    switch (operation) {
        case 'getUser':
            uData = await getUser(event.payload.uid);
            response = {
                statusCode: 200,
                body: uData,
            };
            return response; 
        case 'getUniqueId':
            let uid = getUniqueId();
            return uid;
        case 'createUser':
            // create unique id
            let userId = getUniqueId();
            event.payload.Item.uid = userId.toString();
            theUser = await dynamo.put(event.payload).promise();
            return event.payload;
        case 'updateUser':
            if (!event.payload.Item.hasOwnProperty('uid')) {
                let err = { Message: 'ERROR-uid is required' };
                return err;
            }
            theUser = await dynamo.put(event.payload).promise();
            return event.payload;
        case 'deleteUser':
            response = deleteUser(event, payload);
            return response;
        default:
            payload.status = '400';
            payload.body.message =
                'PATE System Error: operation (' + operation + ') unsupport';
            return payload;
    }
};
async function getUser(var1) {
    const uParams = {
        TableName: 'p8Users',
        KeyConditionExpression: 'uid = :v_uid',
        ExpressionAttributeValues: {
            ':v_uid': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        console.log('uid:' + var1);
        const data = await dynamo.query(uParams).promise();
        console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function deleteUser(event, payload) {
    let requirementsMet = true;
    if (!event.payload.Key.hasOwnProperty('uid')) {
        requirementsMet = false;
    }
    if (requirementsMet) {
        let g = null;
        try {
            g = await dynamo.delete(event.payload).promise();
            return event.payload;
        } catch (error) {
            let returnMsg =
                'Error Deleting: ' + error + '\n ' + g + '\n' + event.payload;
            return returnMsg;
        }
    } else {
        payload.status = '406';
        payload.body.message = 'Pate Error: deleting location';
        return payload;
    }
}
function getUniqueId() {
    //this generates a unique ID based on this specific time
    // Difining algorithm
    const algorithm = 'aes-256-cbc';
    // Defining key
    const key = crypto.randomBytes(32);
    // Defining iv
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    //get the current time...
    let n = Date.now();
    let encrypted = cipher.update(n.toString());
    // Using concatenation
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}
