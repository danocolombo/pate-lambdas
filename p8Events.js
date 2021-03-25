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
            message: '', // message: 'Pate System Error',
        },
    };

    var table = 'p8Events';
    let theEvent = null;
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
            return JSON.stringify(response);
        case 'getActiveEvents':
            // return all events not in past
            eData = await getActiveEvents();
            response = {
                statusCode: 200,
                body: eData,
            };
            return response;
        case 'deleteEvent':
            response = deleteEvent(event, payload);
            return response;
        case 'createEvent':
            event.payload.TableName = 'p8Events';

            // create unique id
            let eventId = crypto.randomBytes(16).toString('base64');
            event.payload.Item.uid = eventId.toString();
            theEvent = await dynamo.put(event.payload).promise();
            return event.payload;

        case 'getEventsForRep':
            //this returns the Events where the uid passed in was the coordinator
            eData = await getEventsForCoordinator(event.payload.uid);
            response = {
                statusCode: 200,
                body: eData,
            };
            return response;
        case 'updateEvent':
            if (!event.payload.Item.hasOwnProperty('uid')) {
                let err = { Message: 'ERROR-uid is required' };
                return err;
            }
            event.payload.TableName = 'p8Events';
            theEvent = await dynamo.put(event.payload).promise();
            return event.payload;
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
            return payload;
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
// get all events for coordinator
async function getEventsForCoordinator(cid) {
    // get all events

    const tParams = {
        TableName: 'p8Events',
    };
    try {
        const data = await dynamo.scan(tParams).promise();
        let rally = [];
        for (let i = 0; i < data.Count; i++) {
            if (data.Items[i].coordinator.id == cid) {
                rally.push(data.Items[i]);
            }
        }
        let returnData = {};
        returnData.Items = rally;

        return returnData;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function deleteEvent(event, payload) {
    let requirementsMet = true;
    console.log('IN');
    console.log(JSON.stringify(event));
    if (!event.payload.Key.hasOwnProperty('uid')) {
        requirementsMet = false;
    }
    if (requirementsMet) {
        event.payload.TableName = 'p8Events';
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
        payload.body.message = 'Pate Error: deleting event';
        return payload;
    }
}
async function getActiveEvents() {
    let payload = {
        status: '400',
        body: {
            message: '', // message: 'Pate System Error',
        },
    };
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
        let theEvents = [];
        // console.log('BEFORE dynamo query');
        const data = await dynamo.scan(uParams).promise();
        // console.log(data);
        // we beleieve data = events
        if (data.Count < 1) {
            // we did not get any events returned from DB
            payload.status = '400';
            return payload;
        } else {
            // we have events returned, sort and send back
            //throw responses into array
            for (let i = 0; i < data.Count; i++) {
                theEvents.push(data.Items[i]);
            }
            theEvents.sort(GetAscendSortOrder('eventDate'));
            return theEvents;
        }
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
function GetAscendSortOrder(prop) {
    return function (a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    };
}
