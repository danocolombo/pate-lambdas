var AWS = require('aws-sdk');
const crypto = require('crypto');
var dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

/**
 * Meeter Groups
 */

exports.handler = async (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let operation = event.operation;
    let groups = null;
    let requirementsMet = null;
    console.log('operation:' + operation);
    let payload = {
        status: '400',
        body: {
            // message: 'Meeter System Error',
        },
    };
    var gData = '';
    switch (operation) {
        case 'getGroupById':
            // get a specific group
            group = await getGroupById(event.payload.groupId);
            //==================================
            // should get the group
            //==================================
            if (group.Count < 1) {
                payload.status = '400';
                return payload;
            } else {
                payload.status = '200';
                payload.count = group.Count;
                payload.body = group.Items[0];
                return payload;
            }
            return response;
        case 'addGroupAbbrev':
            let grpId = getUniqueId();
            event.payload.Item.id = grpId;
            let nGroup = await dynamo.put(event.payload).promise();
            if (nGroup.Count < 1) {
                payload.status = '400';
                return payload;
            } else {
                payload.status = '200';
                payload.body = nGroup;
                return payload;
            }
        case 'getGroupsByMeetingId':
            // get groups for the meetingId
            groups = await getGroupsByMeetingId(event.payload.meetingId);
            //==================================
            // should get array of groups
            //==================================
            if (groups.Count < 1) {
                payload.status = '400';
                return payload;
            } else {
                payload.status = '200';
                payload.count = groups.Count;
                let theGroups = [];
                for (let i = 0; i < groups.Count; i++) {
                    theGroups.push(groups.Items[i]);
                }
                payload.body = theGroups;
                return payload;
            }
            return response;
        case 'addGroup':
            //========================================
            // this will verify minimal data and add
            //========================================
            // REQUIRED:
            //---------------------
            // clientId
            // meetingId
            // title
            //---------------------
            requirementsMet = true;
            if (!event.payload.Item.hasOwnProperty('clientId')) {
                requirementsMet = false;
            }
            if (!event.payload.Item.hasOwnProperty('meetingId')) {
                requirementsMet = false;
            }
            if (!event.payload.Item.hasOwnProperty('title')) {
                requirementsMet = false;
            }
            if (requirementsMet) {
                event.payload.TableName = 'meeterGroups';
                let newId = getUniqueId();
                event.payload.Item.id = newId;
                //return event.payload;
                // let g = await dynamo.put(event.payload).promise();
                let g = null;
                try {
                    g = await dynamo.put(event.payload).promise();
                    return event.payload;
                } catch (error) {
                    return g;
                }
            } else {
                payload.status = '406';
                payload.body.message =
                    'Meeter: Request Not Acceptable. (' +
                    operation +
                    ') Requirements Not Met';
                return payload;
            }
        case 'updateGroup':
            //========================================
            // this will verify minimal data and update
            //========================================
            // REQUIRED:
            //---------------------
            // id
            // clientId
            // meetingId
            // title
            //---------------------
            requirementsMet = true;
            if (!event.payload.Item.hasOwnProperty('id')) {
                requirementsMet = false;
            }
            if (!event.payload.Item.hasOwnProperty('clientId')) {
                requirementsMet = false;
            }
            if (!event.payload.Item.hasOwnProperty('meetingId')) {
                requirementsMet = false;
            }
            if (!event.payload.Item.hasOwnProperty('title')) {
                requirementsMet = false;
            }
            if (requirementsMet) {
                event.payload.TableName = 'meeterGroups';
                // let g = await dynamo.put(event.payload).promise();
                let g = null;
                try {
                    g = await dynamo.put(event.payload).promise();
                    return event.payload;
                } catch (error) {
                    return g;
                }
            } else {
                payload.status = '406';
                payload.body.message =
                    'Meeter: Request Not Acceptable. (' +
                    operation +
                    ') Requirements Not Met';
                return payload;
            }
        case 'deleteGroup':
            //=======================================
            // deleting group
            // REQUIRED:
            //---------------------
            // id
            // clientId
            // meetingId
            //=======================================
            requirementsMet = true;
            if (!event.payload.Key.hasOwnProperty('id')) {
                requirementsMet = false;
            }
            if (!event.payload.Key.hasOwnProperty('clientId')) {
                requirementsMet = false;
            }
            // if (!event.payload.Item.hasOwnProperty('meetingId')) {
            //     requirementsMet = false;
            // }
            if (requirementsMet) {
                event.payload.TableName = 'meeterGroups';
                let g = null;
                try {
                    g = await dynamo.delete(event.payload).promise();
                    return event.payload;
                } catch (error) {
                    let returnMsg =
                        'Error Deleting: ' +
                        error +
                        '\n ' +
                        g +
                        '\n' +
                        event.payload;
                    return returnMsg;
                }
            } else {
                payload.status = '406';
                payload.body.message =
                    'Meeter: Request Not Acceptable. (' +
                    operation +
                    ') Requirements Not Met';
                return payload;
            }
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
            return payload;
    }
};
async function getGroupById(var1) {
    const uParams = {
        TableName: 'meeterGroups',
        KeyConditionExpression: 'id = :v_id',
        ExpressionAttributeValues: {
            ':v_id': var1,
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
async function getGroupsByMeetingId(var1) {
    const mParams = {
        TableName: 'meeterGroups',
        IndexName: 'meetingId-index',
        KeyConditionExpression: 'meetingId = :v_id',
        ExpressionAttributeValues: {
            ':v_id': var1,
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
