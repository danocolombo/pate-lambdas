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
    var uData = '';
    switch (operation) {
        case 'getLocation':
            uData = await getLocation(event.payload.uid);
            const response = {
                statusCode: 200,
                body: uData,
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
async function getLocation(var1) {
    const uParams = {
        TableName: 'p8Locations',
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
    const evnt = new Date(now);
    console.log('tDay: ' + evnt.toISOString());
    // const mParams = {
    //     TableName: 'p8Events',
    //     IndexName: 'clientId-index',
    //     KeyConditionExpression: 'clientId = :v_id',
    //     ExpressionAttributeValues: {
    //         ':v_id': var1,
    //     },
    // };
    // try {
    //     // console.log('BEFORE dynamo query');
    //     const data = await dynamo.query(mParams).promise();
    //     // console.log(data);
    //     return data;
    // } catch (err) {
    //     console.log('FAILURE in dynamoDB call', err.message);
    // }
    return 'TEST';
}
