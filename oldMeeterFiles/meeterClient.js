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

    event.payload.TableName = 'meeterClientProfiles';
    let payload = {
        status: '400',
        body: {
            // message: 'Meeter System Error',
        },
    };
    switch (operation) {
        case 'getClient':
            const requestedClient = await getClient(event.payload.clientId);
            return requestedClient;
            break;

        case 'getClients':
            const requestedClients = await getClients();
            return requestedClients;
            break;
        case 'getAuth':
            const requestedAuth = await getAuth(
                event.payload.uid,
                event.payload.clientId
            );
            return requestedAuth;
            break;
        case 'getConfigs':
            const configs = await getClientMeetingConfigs(
                event.payload.clientId
            );
            if (configs) {
                payload.status = '200';
                payload.body = configs;
                return payload;
            } else {
                payload.status = '400';
                return payload;
            }
        case 'getDefaultGroups':
            const defaultGroups = await getDefaultGroups(
                event.payload.clientId
            );
            if (defaultGroups) {
                payload.status = '200';
                payload.body = defaultGroups;
                return payload;
            } else {
                payload.status = '400';
                return payload;
            }
        case 'updateMeetingConfig':
            //this will change the configuration value
            const toggledConfigs = await updateMeetingConfig(
                event.payload.clientId,
                event.payload.config,
                event.payload.value
            );
            if (toggledConfigs) {
                payload.status = '200';
                payload.body = toggledConfigs;
                return payload;
            } else {
                payload.status = '400';
                return payload;
            }
        case 'updateMeeterConfigs':
            //this will change the configuration value
            const nConfigs = await updateMeeterConfigs(
                event.payload.clientId,
                event.payload.config,
                event.payload.setting
            );
            if (nConfigs) {
                payload.status = '200';
                payload.body = nConfigs;
                return payload;
            } else {
                payload.status = '400';
                return payload;
            }
        case 'echo':
            callback(null, 'Success');
            break;
        default:
            callback('Unknown operation: ${operation}');
    }
};
async function getClient(var1) {
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
//get the configurations for a client
async function getClientMeetingConfigs(var1) {
    const mParams = {
        TableName: 'meeterConfigs',
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :v_client',
        ExpressionAttributeValues: {
            ':v_client': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const data = await dynamo.query(mParams).promise();
        let configs = {};
        for (let i = 0; i < data.Items.length; i++) {
            configs[data.Items[i].config] = data.Items[i].setting;
        }
        return configs;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
//get the defaultGroups for a client
async function getDefaultGroups(var1) {
    const tParams = {
        TableName: 'meeterClientProfiles',
        KeyConditionExpression: 'clientId = :v_clientId',
        ExpressionAttributeValues: {
            ':v_clientId': var1,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        const clientRecord = await dynamo.query(tParams).promise();
        let allGroups = clientRecord.Items[0].defaultGroups;
        // let dGroups = {};
        // // console.log('LENGTH: ' + allGroups.length);
        // for (let i = 0; i < allGroups.length; i++) {
        //     dGroups[allGroups[i].config] = dGroups[i].value;
        // }

        // console.log('\n\n========================\n');
        // console.log(JSON.stringify(dGroups));
        // console.log('\n\n========================\n');
        return allGroups;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
async function getClients() {
    //return var1 + var2;
    const tParams = {
        TableName: 'meeterClientProfiles',
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
//
async function getAuth(uid, clientId) {
    try {
        const theClient = await getClient(clientId);
        //=====================================
        // now get the user reference to uid
        //=====================================

        // console.log(data);
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
// updateMeeterConfigs
async function updateMeeterConfigs(var1, var2, var3) {
    let newSetting = null;
    if (var3 === 'true') {
        newSetting = true;
    } else {
        newSetting = false;
    }
    //var1=clientId, var2=config, var3=value
    //===========================================
    const params = {
        TableName: 'meeterConfigs',
        Key: { clientId: var1, config: var2 },
        UpdateExpression: `set setting = :newValue`,
        ExpressionAttributeValues: {
            ':newValue': newSetting,
        },
        ReturnValues: 'ALL_NEW',
    };
    const response = await dynamo.update(params).promise();
    return response;
}
