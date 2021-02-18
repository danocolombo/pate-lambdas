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
    var eData = '';
    var response = '';
    switch (operation) {
        case 'getEvent':
            eData = await getEvent(event.payload.uid);
            response = {
                statusCode: 200,
                body: eData,
            };
            return response;
        case 'getEvents':
            eData = await getEvents();
            response = {
                statusCode: 200,
                body: eData,
            };
            return response;
        case 'getActiveEvents':
            // return all events not in past
            eData = await getActiveEvents();
            response = {
                statusCode: 200,
                body: eData,
            };
            return response;
        case 'saveEvent':
            //this will save the event to the database,
            //but we do require some values before
            //taking action
            //========================================
            let errMsg = {};
            requirementsMet = true;
            if (!event.payload.Item.location.hasOwnProperty('name')) {
                requirementsMet = false;
                errMsg = { locaton: { name: 'not satisfied' } };
            }
            if (!event.payload.Item.location.hasOwnProperty('state')) {
                requirementsMet = false;
                errMsg = { location: { state: 'not satisfied' } };
            }
            if (!event.payload.Item.location.hasOwnProperty('city')) {
                requirementsMet = false;
                errMsg = { location: { city: 'not satisfied' } };
            }
            if (!event.payload.Item.hasOwnProperty('startTime')) {
                requirementsMet = false;
                errMsg = { startTime: 'not satisfied' };
            }
            if (!event.payload.Item.hasOwnProperty('endTime')) {
                requirementsMet = false;
                errMsg = { endTime: 'not satisfied' };
            }
            if (!event.payload.Item.hasOwnProperty('eventDate')) {
                requirementsMet = false;
                errMsg = { eventDate: 'not satisfied' };
            }
            if (!event.payload.Item.contact.hasOwnProperty('name')) {
                requirementsMet = false;
                errMsg = { contact: { name: 'not satisfied' } };
            }
            if (!event.payload.Item.coordinator.hasOwnProperty('name')) {
                requirementsMet = false;
                errMsg = { coordinator: { name: 'not satisfied' } };
            }
            if (!event.payload.Item.coordinator.hasOwnProperty('uid')) {
                requirementsMet = false;
                errMsg = { coordinator: { uid: 'not satisfied' } };
            }
            if (requirementsMet) {
                //check to see if the Item has id or is new
                if (!event.payload.Item.hasOwnProperty('uid')) {
                    let newId = getUniqueId();
                    console.log('newId:' + newId);
                    event.payload.Item.uid = newId;
                }

                event.payload.TableName = 'p8Events';
                let eventResponse = null;
                try {
                    eventResponse = await dynamo.put(event.payload).promise();
                    return event.payload;
                } catch {
                    return eventResponse;
                }
            } else {
                payload.status = '406';
                payload.body.message =
                    'Pate: Request Not Acceptable. (' +
                    operation +
                    ') Requirements Not Met';
                payload.errorMessage = errMsg;
                return payload;
            }
            break;
        case 'echo':
            callback(null, 'Success');
            break;
        case 'ping':
            callback(null, 'pong');
            break;
        default:
            payload.status = '400';
            payload.body.message =
                'PATE System Error: operation (' + operation + ') unsupport';
            //return payload;
            callback('Unknown operation: ${operation}');
    }
};
async function getEvent(var1) {
    const uParams = {
        TableName: 'p8Events',
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
async function getEvents() {
    // get all events
    const tParams = {
        TableName: 'p8Events',
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.scan(tParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function getActiveEvents() {
    //returning events today or future
    const theDate = new Date(Date.now());
    const tDay = theDate.toISOString().substring(0, 10);
    const targetDate = tDay.split('-').join('');
    const uParams = {
        TableName: 'p8Events',
        ExpressionAttributeValues: {
            ':v_date': targetDate,
        },
        FilterExpression: 'eventDate >= :v_date',
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.scan(uParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
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
