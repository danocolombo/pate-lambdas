var AWS = require('aws-sdk');
var dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const crypto = require('crypto');

/**
 * Meeter People
 */

exports.handler = async (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let operation = event.operation;
    let peeps = null;
    console.log('operation:' + operation);
    let payload = {
        status: '400',
        body: {
            // message: 'Meeter System Error',
        },
    };
    var mData = '';
    switch (operation) {
        case 'getPeopleByName':
            // get all people for clientId
            peeps = await getPeopleByName(event.payload.name);
            //==================================
            // should get array of people
            //==================================

            if (peeps.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no peeps found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = peeps.Count;
                let thepeeps = [];
                for (let i = 0; i < peeps.Count; i++) {
                    thepeeps.push(peeps.Items[i]);
                }
                payload.body = thepeeps;
                return payload;
            }
            return response;
        case 'getPeopleByNameAndClient':
            // get all people for clientId
            peeps = await getPeopleByNameAndClient(
                event.payload.name,
                event.payload.clientId
            );
            //==================================
            // should get array of people
            //==================================

            if (peeps.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no peeps found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = peeps.Count;
                let thepeeps = [];
                for (let i = 0; i < peeps.Count; i++) {
                    thepeeps.push(peeps.Items[i]);
                }
                payload.body = thepeeps;
                return payload;
            }
            return response;
        case 'getPeopleByIdAndClient':
            // get all people for by id and clientId
            peeps = await getPeopleByIdAndClient(
                event.payload.id,
                event.payload.clientId
            );
            //==================================
            // should get array of id for the client
            //==================================

            if (peeps.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no peeps found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = peeps.Count;
                let thepeeps = [];
                for (let i = 0; i < peeps.Count; i++) {
                    thepeeps.push(peeps.Items[i]);
                }
                payload.body = thepeeps;
                return payload;
            }
            return response;
        case 'getAllPeoleByClient':
            // get all people for by id and clientId
            peeps = await getAllPeopleByClient(event.payload.clientId);
            //==================================
            // should get array of id for the client
            //==================================

            if (peeps.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no peeps found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = peeps.Count;
                let thepeeps = [];
                for (let i = 0; i < peeps.Count; i++) {
                    thepeeps.push(peeps.Items[i]);
                }
                payload.body = thepeeps;
                return payload;
            }
            return response;
        // case 'getFutureMeetings':
        //     // get the Future Meetings for clientId
        //     meetings = await getMeetings(event.payload.clientId);
        //     //==================================
        //     // should get array of meetings
        //     //==================================

        //     if (meetings.Count < 1) {
        //         payload.status = '400';
        //         // payload.body.message = 'no meetings found';
        //         return payload;
        //     } else {
        //         // get todays date
        //         let d = new Date();
        //         var n = d.toISOString();
        //         let fullDate = n.split('T');
        //         let today = fullDate[0];

        //         payload.status = '200';
        //         payload.aFilterDate = today;
        //         let filterCnt = 0;
        //         let theMeetings = [];
        //         for (let i = 0; i < meetings.Count; i++) {
        //             let m = meetings.Items[i];
        //             if (m.meetingDate >= today) {
        //                 filterCnt++;
        //                 theMeetings.push(meetings.Items[i]);
        //             }
        //         }

        //         if (filterCnt > 0) {
        //             let sortedMeetings = [];
        //             theMeetings.sort(GetAscendSortOrder('meetingDate')); //sorts based on date, latest first
        //             payload.body = theMeetings;
        //         } else {
        //             payload.body = {};
        //         }
        //         payload.count = filterCnt;
        //         return payload;
        //     }
        //     return response;
        // case 'getHistoricMeetings':
        //     // get the Historic Meetings for clientId
        //     meetings = await getMeetings(event.payload.clientId);
        //     //==================================
        //     // should get array of meetings
        //     //==================================

        //     if (meetings.Count < 1) {
        //         payload.status = '400';
        //         // payload.body.message = 'no meetings found';
        //         return payload;
        //     } else {
        //         // get todays date
        //         let d = new Date();
        //         var n = d.toISOString();
        //         let fullDate = n.split('T');
        //         let today = fullDate[0];

        //         payload.status = '200';
        //         payload.aFilterDate = today;
        //         let filterCnt = 0;
        //         let theMeetings = [];
        //         for (let i = 0; i < meetings.Count; i++) {
        //             let m = meetings.Items[i];
        //             if (m.meetingDate < today) {
        //                 filterCnt++;
        //                 theMeetings.push(meetings.Items[i]);
        //             }
        //         }

        //         if (filterCnt > 0) {
        //             let sortedMeetings = [];
        //             theMeetings.sort(GetSortOrder('meetingDate')); //sorts based on date, latest first
        //             payload.body = theMeetings;
        //         } else {
        //             payload.body = {};
        //         }

        //         return payload;
        //     }
        //     return response;
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
        //callback('Unknown operation: ${operation}');
    }
};

//getAllPeopleByClient
async function getAllPeopleByClient(var1) {
    const mParams = {
        TableName: 'meeterPeopleProfiles',
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :v_clientId',
        ExpressionAttributeValues: {
            ':v_clientId': var1,
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

async function getPeopleByName(var1) {
    const mParams = {
        TableName: 'meeterPeopleProfiles',
        IndexName: 'fullName-index',
        KeyConditionExpression: 'fullName = :v_name',
        ExpressionAttributeValues: {
            ':v_name': var1,
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
//getPeopleByIdAndClient
async function getPeopleByIdAndClient(var1, var2) {
    const uParams = {
        TableName: 'meeterPeopleProfiles',
        KeyConditionExpression: 'id = :v_id and clientId = :v_clientId',
        ExpressionAttributeValues: {
            ':v_id': var1,
            ':v_clientId': var2,
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

async function getPeopleByNameAndClient(var1, var2) {
    const mParams = {
        TableName: 'meeterPeopleProfiles',
        IndexName: 'fullName-clientId-index',
        KeyConditionExpression: 'fullName = :v_name and clientId = :v_clientId',
        ExpressionAttributeValues: {
            ':v_name': var1,
            ':v_clientId': var2,
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
//Comparer Function
function GetSortOrder(prop) {
    return function (a, b) {
        if (a[prop] < b[prop]) {
            return 1;
        } else if (a[prop] > b[prop]) {
            return -1;
        }
        return 0;
    };
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
