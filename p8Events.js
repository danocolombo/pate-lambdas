var AWS = require('aws-sdk');
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
async function getActiveEvents() {
    const theDate = new Date(Date.now());
    const tDay = theDate.toISOString().substring(0, 10);
    console.log('tDay: ' + tDay);
    const mParams = {
        TableName: 'p8Events',
        IndexName: 'eventDate-index',
        KeyConditionExpression: 'eventDate >= :v_tDay',
        ExpressionAttributeValues: {
            ':v_tDay': tDay,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(mParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
    return tDay;
}
async function getEvents() {
    const theDate = new Date(Date.now());
    const tDay = theDate.toISOString().substring(0, 10);
    console.log('tDay: ' + tDay);
    const mParams = {
        TableName: 'p8Events',
        IndexName: 'eventDate-index',
        KeyConditionExpression: 'eventDate >= :v_tDay',
        ExpressionAttributeValues: {
            ':v_tDay': tDay,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(mParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
