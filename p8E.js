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
        case 'getEvent':
            uData = await getE(event.payload.uid);
            const response = {
                statusCode: 200,
                body: uData,
            };
            return response;

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
async function getE(var1) {
    const uParams = {
        TableName: 'p8Events',
        KeyConditionExpression: 'uid = :v_uid',
        ExpressionAttributeValues: {
            ':v_uid': var1,
        },
    };
    console.log('HERE');
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
