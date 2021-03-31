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
    console.log('Received event:', JSON.stringify(event, null, 2));

    var operation = event.operation;
    let payload = {
        status: '400',
        body: {
            message: '', // message: 'Pate System Error',
        },
    };
    let theRegistration = null;
    var response = '';
    var rData = '';
    event.payload.TableName = 'p8Registrations';
    switch (operation) {
        case 'getRegistration':
            rData = await getRegistration(event.payload.uid);
            response = {
                statusCode: 200,
                body: rData,
            };
            return response;
        case 'createRegistration':
            // create unique id
            let registrationId = getUniqueId();
            event.payload.Item.uid = registrationId.toString();
            theRegistration = await dynamo.put(event.payload).promise();
            return event.payload;
        case 'updateRegistration':
            if (!event.payload.Key.hasOwnProperty('uid')) {
                let err = { Message: 'ERROR-uid is required' };
                return err;
            }
            theRegistration = await dynamo.put(event.payload).promise();
            return event.payload;
        case 'deleteRegistration':
            response = deleteRegistration(event, payload);
            return response;
        case 'getAllUserRegistrations':
            // this needs to return all the entries from p8events where rid = passed in value
            // get the registrar id from event
            let registrarId = null;
            try {
                let rid = event.payload.rid;
                registrarId = rid;
            } catch (error) {
                let err = { Message: 'ERROR-rid is required' };
                return err;
            }
            try {
                rData = await getAllUserRegistrations(registrarId);
                response = {
                    statusCode: 200,
                    body: rData,
                };
            } catch (error) {
                let err = {
                    Message: 'getAllUserRegistrations function failed.',
                };
                return err;
            }
            return response;

        default:
            payload.status = '400';
            payload.body.message =
                'PATE System Error: operation (' + operation + ') unsupport';
            //return payload;
            return payload;
    }
};
async function getAllUserRegistrations(var1) {
    const uParams = {
        TableName: 'p8Registrations',
        IndexName: 'rid-index',
        KeyConditionExpression: 'rid = :v_rid',
        ExpressionAttributeValues: {
            ':v_rid': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        // console.log('rid:' + var1);
        const data = await dynamo.query(uParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
        return err;
    }
}
async function getRegistration(var1) {
    const uParams = {
        TableName: 'p8Registrations',
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
async function deleteRegistration(event, payload) {
    let requirementsMet = true;
    if (!event.payload.Key.hasOwnProperty('uid')) {
        requirementsMet = false;
    }
    if (requirementsMet) {
        // event.payload.TableName = 'p8Events';
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
