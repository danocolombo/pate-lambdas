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
            // message: 'Meeter System Error',
        },
    };
    var uData = '';
    switch (operation) {
        case 'authenticate':
            //--------------------------------------------
            // input: uid (sub)
            // 1. get user
            // 2. take user.defaultClient, get permissons
            // 3. return results
            //--------------------------------------------
            // default payload
            // let payload = {
            //     status: '400',
            //     body: {
            //         // message: 'Meeter System Error',
            //     },
            // };
            const user = await getUser(event.payload.uid);

            if (user.Count != 1) {
                payload.status = '400';
                payload.body.message = 'unknown user';
                return payload;
            } else {
                payload.status = '200';
                payload.body._id = event.payload.uid;
                payload.body.name =
                    user.Items[0].firstName + ' ' + user.Items[0].lastName;
                payload.body.email = user.Items[0].email;
                payload.body.phone = user.Items[0].phone;
                payload.body.defaultClient = user.Items[0].defaultClient;
            }
            //==================================
            // now get client permissons
            const client = await getClient(user.Items[0].defaultClient);

            if (client.Count != 1) {
                payload.body.role = 'undefined';
                payload.body.status = 'undefind';
            } else {
                //==============================
                // we got client info find user
                //==============================
                const users = client.Items[0].users;
                let userRole = 'undefined';
                let userStatus = 'undefined';
                for (var i = 0; i < users.length; i++) {
                    var u = users[i];
                    if (u.id == payload.body._id) {
                        userRole = u.role;
                        userStatus = u.status;
                    }
                }
                payload.body.role = userRole;
                payload.body.status = userStatus;
                // console.log('-----D@NO DEBUG----------');
                // const util = require('util');
                // console.log(
                //     '==> users: \n' +
                //         util.inspect(users, { showHidden: false, depth: null })
                // );
                // console.log('------END DEBUG---------');
            }
            return payload;
        case 'getUserByUserName':
            uData = await getUserByUserName(event.payload.Key.userName);
            return uData;
            break;
        case 'getUserByEmail':
            uData = await getUserByEmail(event.payload.Key.email);
            return uData;
            break;
        case 'getUser':
            uData = await getUser(event.payload.uid);
            const response = {
                statusCode: 200,
                body: uData,
            };
            return response;

            break;
        case 'validate':
            console.log('VALIDATING');
            event.payload.TableName = 'meeterUsers';
            dynamo.get(event.payload, callback);
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
                'Meeter System Error: operation (' + operation + ') unsupport';
            //return payload;
            callback('Unknown operation: ${operation}');
    }
};
async function getUser(var1) {
    const uParams = {
        TableName: 'meeterUserProfiles',
        // indexName: 'userName-password-index',
        KeyConditionExpression: 'uid = :v_uid',
        ExpressionAttributeValues: {
            ':v_uid': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(uParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function getClient(var1) {
    //return var1 + var2;
    const tParams = {
        TableName: 'meeterClientProfiles',
        KeyConditionExpression: 'clientId = :v_clientId',
        ExpressionAttributeValues: {
            ':v_clientId': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(tParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function getUserByUserName(var1) {
    const uParams = {
        TableName: 'meeterUsers',
        KeyConditionExpression: 'userName = :v_userName',
        ExpressionAttributeValues: {
            ':v_userName': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(uParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function getUserByEmail(var1) {
    const tParams = {
        TableName: 'meeterUsers',
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :v_id',
        ExpressionAttributeValues: {
            ':v_id': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(tParams).promise();
        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function authenticate(var1, var2) {
    //return var1 + var2;
    const uParams = {
        TableName: 'meeterUsers',
        ExpressionAttributeValues: {
            ':v_email': var1,
            ':v_password': var2,
        },
        FilterExpression: 'email = :v_email and password = :v_password',
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
