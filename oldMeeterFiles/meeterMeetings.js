var AWS = require('aws-sdk');
var dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const crypto = require('crypto');

/**
 * Meeter Meetings
 */

exports.handler = async (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let operation = event.operation;
    let meetings = null;
    let requirementsMet = null;
    console.log('operation:' + operation);
    let payload = {
        status: '400',
        body: {
            // message: 'Meeter System Error',
        },
    };
    var mData = '';
    switch (operation) {
        case 'getFutureMeetings1':
            // get the Future Meetings for clientId
            meetings = await getMeetings(event.payload.clientId);
            //==================================
            // should get array of meetings
            //==================================

            if (meetings.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no meetings found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = meetings.Count;
                let theMeetings = [];
                for (let i = 0; i < meetings.Count; i++) {
                    let m = {};
                    let mtg = meetings.Items[i];
                    m._id = mtg.id;
                    m.clientId = mtg.clientId; // required field no need to check
                    if (mtg.meetingDate) m.meetingDate = mtg.meetingDate;
                    if (mtg.meetingType) m.type = mtg.meetingType;
                    if (mtg.title) m.title = mtg.title;
                    if (mtg.attendance) m.attendance = mtg.attendance;
                    if (mtg.faciliator) m.facilitator = mtg.facilitator;
                    if (mtg.supportRole) m.supportRole = mtg.supportRole;
                    if (mtg.announcementContact)
                        m.announcementContact = mtg.announcementContact;
                    if (mtg.cafeCoordinator)
                        m.cafeCoordinator = mtg.cafeCoordinator;
                    if (mtg.cafeCount) m.cafeCount = mtg.cafeCount;
                    if (mtg.children) m.children = mtg.children;
                    if (mtg.childrenContact)
                        m.childrenContact = mtg.childrenContact;
                    if (mtg.cleanupContact)
                        m.cleanupContact = mtg.cleanupContact;
                    if (mtg.closingContact)
                        m.closingContact = mtg.closingContact;
                    if (mtg.donations) m.donations = mtg.donations;
                    if (mtg.greeterContact1)
                        m.greeterContact1 = mtg.greeterContact1;
                    if (mtg.greeterContact2)
                        m.greeterContact2 = mtg.greeterContact2;
                    if (mtg.meal) m.meal = mtg.meal;
                    if (mtg.mealCnt) m.mealCnt = mtg.mealCnt;
                    if (mtg.mealCoordinator)
                        m.mealCoordinator = mtg.mealCoordinator;
                    if (mtg.newcomers) m.newcomers = mtg.newcomers;
                    if (mtg.meetingType) m.meetingType = mtg.meetingType;
                    if (mtg.notes) m.notes = mtg.notes;
                    if (mtg.nursery) m.nursery = mtg.nursery;
                    if (mtg.nurseryContact)
                        m.nurseryContact = mtg.nurseryContact;
                    if (mtg.resourceContact)
                        m.resourceContact = mtg.resourceContact;
                    if (mtg.securityContact)
                        m.securityContact = mtg.securityContact;
                    if (mtg.setupContact) m.setupContact = mtg.setupContact;
                    if (mtg.supportRole) m.supportRole = mtg.supportRole;
                    if (mtg.transportationContact)
                        m.transportationContact = mtg.transportationContact;
                    if (mtg.transportationCount)
                        m.transportationCount = mtg.transportationCount;
                    if (mtg.worship) m.worship = mtg.worship;
                    if (mtg.youth) m.youth = mtg.youth;
                    if (mtg.youthContact) m.youthContact = mtg.youthContact;
                    theMeetings.push(m);
                }
                payload.body = theMeetings;

                return payload;
            }
            return response;
        case 'createMeeting':
            event.payload.TableName = 'meeterMeetings';

            // create unique id
            let meetingId = crypto.randomBytes(16).toString('base64');
            event.payload.Item.id = meetingId.toString();
            let mtg = await dynamo.put(event.payload).promise();

            return mtg;
            break;
        case 'putMeeting':
            //--------------------------
            // required fields:
            // id, clientId, meetingDate, meetingType, title
            //--------------------------
            requirementsMet = true;
            if(!event.payload.Item.hasOwnProperty('id')){
                requirementsMet = false;
            }
            if(!event.payload.Item.hasOwnProperty('clientId')){
                requirementsMet = false;
            }
            if(!event.payload.Item.hasOwnProperty('meetingDate')){
                requirementsMet = false;
            }
            if(!event.payload.Item.hasOwnProperty('meetingType')){
                requirementsMet = false;
            }
            if(!event.payload.Item.hasOwnProperty('title')){
                requirementsMet = false;
            }
            if (requirementsMet){
                event.payload.TableName = 'meeterMeetings';
                if (event.payload.Item.id === '0'){
                    let newId = getUniqueId();
                    event.payload.Item.id = newId;
                }
                let meetingResponse = null;
                try {
                    meetingResponse = await dynamo.put(event.payload).promise();
                    return event.payload;
                }catch{
                    return meetingResponse;
                }
            } else {
                payload.status = '406';
                payload.body.message = 'Meeter: Request Not Acceptable. (' +
                operation +
                ') Requirements Not Met';
                return payload;
            }
        case 'getAllMeetings':
            // get the Future Meetings for clientId
            meetings = await getMeetings(event.payload.clientId);
            //==================================
            // should get array of meetings
            //==================================

            if (meetings.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no meetings found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = meetings.Count;
                let theMeetings = [];
                for (let i = 0; i < meetings.Count; i++) {
                    theMeetings.push(meetings.Items[i]);
                }
                payload.body = theMeetings;
                return payload;
            }
            return response;
        case 'getFutureMeetings':
            // get the Future Meetings for clientId
            meetings = await getMeetings(event.payload.clientId);
            //==================================
            // should get array of meetings
            //==================================

            if (meetings.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no meetings found';
                return payload;
            } else {
                // get todays date
                let d = new Date();
                var n = d.toISOString();
                let fullDate = n.split('T');
                let today = fullDate[0];

                payload.status = '200';
                payload.aFilterDate = today;
                let filterCnt = 0;
                let theMeetings = [];
                for (let i = 0; i < meetings.Count; i++) {
                    let m = meetings.Items[i];
                    if (m.meetingDate >= today) {
                        filterCnt++;
                        theMeetings.push(meetings.Items[i]);
                    }
                }

                if (filterCnt > 0) {
                    let sortedMeetings = [];
                    theMeetings.sort(GetAscendSortOrder('meetingDate')); //sorts based on date, latest first
                    payload.body = theMeetings;
                } else {
                    payload.body = {};
                }
                payload.count = filterCnt;
                return payload;
            }
            return response;
        case 'getHistoricMeetings':
            // get the Historic Meetings for clientId
            meetings = await getMeetings(event.payload.clientId);
            //==================================
            // should get array of meetings
            //==================================

            if (meetings.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no meetings found';
                return payload;
            } else {
                // get todays date
                let d = new Date();
                var n = d.toISOString();
                let fullDate = n.split('T');
                let today = fullDate[0];

                payload.status = '200';
                payload.aFilterDate = today;
                let filterCnt = 0;
                let theMeetings = [];
                for (let i = 0; i < meetings.Count; i++) {
                    let m = meetings.Items[i];
                    if (m.meetingDate < today) {
                        filterCnt++;
                        theMeetings.push(meetings.Items[i]);
                    }
                }

                if (filterCnt > 0) {
                    let sortedMeetings = [];
                    theMeetings.sort(GetSortOrder('meetingDate')); //sorts based on date, latest first
                    payload.body = theMeetings;
                } else {
                    payload.body = {};
                }

                return payload;
            }
            return response;
        case 'getMeetingByIdAndClient':
            // get the specific meeting
            meetings = await getMeetingByIdAndClient(
                event.payload.id,
                event.payload.clientId
            );
            //==================================
            // should get the meeting
            //==================================
            if (meetings.Count < 1) {
                payload.status = '400';
                // payload.body.message = 'no meetings found';
                return payload;
            } else {
                payload.status = '200';
                payload.count = meetings.Count;
                let theMeetings = [];
                for (let i = 0; i < meetings.Count; i++) {
                    theMeetings.push(meetings.Items[i]);
                }
                //payload.body = theMeetings;
                payload.body = meetings.Items[0];
                return payload;
            }
            return response;

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
                'Meeter System Error: operation (' + operation + ') unsupport';
            return payload;
        //callback('Unknown operation: ${operation}');
    }
};
async function getMeetings(var1) {
    const mParams = {
        TableName: 'meeterMeetings',
        IndexName: 'clientId-index',
        KeyConditionExpression: 'clientId = :v_id',
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
async function getMeetingByIdAndClient(var1, var2) {
    const uParams = {
        TableName: 'meeterMeetings',
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