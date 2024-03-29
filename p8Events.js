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
        // case 'createLocation':
        //         // create unique id
        //         let locationId = getUniqueId();
        //         event.payload.Item.uid = locationId.toString();
        //         theLocation = await dynamo.put(event.payload).promise();
        //         return event.payload;
        case 'createEvent':
            event.payload.TableName = 'p8Events';
            let eventID = getUniqueId();
            // create unique id
            event.payload.Item.uid = eventID.toString();
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
        case 'getEventsForLead':
            //this returns the Events where the uid passed in was the coordinator
            if (!event.payload.Item.hasOwnProperty('stateID')) {
                let err = { Message: 'ERROR-stateID is required' };
                return err;
            }
            eData = await getEventsForLead(event.payload.Item.stateID);
            response = {
                statusCode: 200,
                body: eData,
            };
            return response;
        case 'maintainNumbers':
            if (!event.payload.hasOwnProperty('uid')) {
                let err = { Message: 'ERROR-uid is required' };
                return err;
            }
            //we get the possibility of 4 settings
            // 1. registerationCount (registrations)
            // 2. mealCount (meal/mealCount)
            // 3. attendeeCount (attendance)
            // 4. mealsServed (meal/mealsServed)
            // eData = { eid: event.payload.uid };
            eData = await maintainEventNumbers(event.payload);
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
        // console.log(JSON.parse(data));
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
        FilterExpression: 'contains(coordinator.id, :cid)',
        ExpressionAttributeValues: {
            ':cid': cid,
        },
    };
    try {
        const data = await dynamo.scan(tParams).promise();
        // let rally = [];
        // for (let i = 0; i < data.Count; i++) {
        //     if (data.Items[i].coordinator.id == cid) {
        //         rally.push(data.Items[i]);
        //     }
        // }
        // let returnData = {};
        // returnData.Items = rally;

        // return returnData;
        return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
    }
}
// get all events for a particular state
async function getEventsForLead(sid) {
    // get all events

    const tParams = {
        TableName: 'p8Events',
        FilterExpression: 'contains(stateProv, :stateProv)',
        ExpressionAttributeValues: {
            ':stateProv': sid,
        },
    };
    try {
        const data = await dynamo.scan(tParams).promise();
        // let rally = [];
        // for (let i = 0; i < data.Count; i++) {
        //     if (data.Items[i].stateProv == sid) {
        //         rally.push(data.Items[i]);
        //     }
        // }
        // let returnData = {};
        // returnData.Items = rally;

        // return returnData;
        return data;
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

async function maintainEventNumbers(request) {
    /*
        it should look like this....
        "request": {
            "uid": "65ff55fb33fe4c0447b086188f2e9b1g",
            "adjustments": {
                "registrationCount": "2",
                "mealCount": "2",
                "attendance": "0",
                "mealsServed": "0",
            }
        }

        NOTE that the adjustments can vary from to all 4

    */
    let adjustments = request.adjustments;
    const ADJ_REGISTRATIONS = request.adjustments.hasOwnProperty('registrationCount');
    const ADJ_MEAL_PLAN = request.adjustments.hasOwnProperty('mealCount');
    const ADJ_ATTENDANCE = request.adjustments.hasOwnProperty('attendance');
    const ADJ_MEALS_FED = request.adjustments.hasOwnProperty('mealsServed');
    //now get the event
    let theStoredEvent = {};
    const uParams = {
        TableName: 'p8Events',
        KeyConditionExpression: 'uid = :v_uid',
        ExpressionAttributeValues: {
            ':v_uid': request.uid,
        },
    };
    try {
        // console.log('BEFORE dynamo query');
        // console.log('uid:' + var1);
        theStoredEvent = await dynamo.query(uParams).promise();
        // console.log(data);
        // return data;
    } catch (err) {
        console.log('FAILURE in dynamoDB call', err.message);
        return {'ERROR': 'trying to get original event'}
    }
    // console.log('VVVVVVVVVVVVVVVVV');
    // const util = require('util');
    // console.log('theStoredEvent:  \n' + util.inspect(theStoredEvent, { showHidden: false, depth: null }));
    // console.log('^^^^^^^^^^^^^^^^^');
    // console.log('==> registrations:' + theStoredEvent.Items[0].registrations);
    const WAS_REGISTRATIONS = theStoredEvent.Items[0].registrations;
    // console.log('==> mealCount:' + theStoredEvent.Items[0].meal.mealCount);
    const WAS_MEAL_PLAN = theStoredEvent.Items[0].meal.mealCount;
    // console.log('==> attendance:' + theStoredEvent.Items[0].attendance);
    const WAS_ATTENDANCE = theStoredEvent.Items[0].attendance;
    // console.log('==> mealsServed:' + theStoredEvent.Items[0].meal.mealsServed);
    const WAS_MEALS_FED = theStoredEvent.Items[0].meal.mealsServed;

    // console.log('WAS_REGISTRATIONS:'+WAS_REGISTRATIONS);
    // console.log('WAS_MEAL_PLAN:'+WAS_MEAL_PLAN);
    // console.log('WAS_ATTENDANCE:'+WAS_ATTENDANCE);
    // console.log('WAS_MEALS_FED:'+WAS_MEALS_FED);

    // console.log('ADJ_REGISTRATIONS:'+ADJ_REGISTRATIONS);
    // console.log('ADJ_MEAL_PLAN:'+ADJ_MEAL_PLAN);
    // console.log('ADJ_ATTENDANCE:'+ADJ_ATTENDANCE);
    // console.log('ADJ_MEALS_FED:'+ADJ_MEALS_FED);
    //!!!!!!!!!!!!!!!!!!!!!!
    // need error handling in case bad uid provided.
    let workingEvent = theStoredEvent.Items[0];
    
    
    
    workingEvent.meal.mealsServed = parseInt(WAS_MEALS_FED) + ADJ_MEALS_FED;
    // console.log('workingEvent:  \n' + util.inspect(workingEvent, { showHidden: false, depth: null }));
    
    
    if (ADJ_REGISTRATIONS) {
        const DELTA_REGISTRATIONS = parseInt(request.adjustments.registrationCount);
        if((parseInt(WAS_REGISTRATIONS) + DELTA_REGISTRATIONS)< 1) {
            workingEvent.registrations = 0;
        }else{
            workingEvent.registrations = parseInt(WAS_REGISTRATIONS) + DELTA_REGISTRATIONS;
        }
    }
    if (ADJ_MEAL_PLAN) {
        const DELTA_MEAL_PLAN = parseInt(request.adjustments.mealCount);
        if((parseInt(WAS_MEAL_PLAN) + DELTA_MEAL_PLAN)< 1) {
            workingEvent.meal.mealCount = 0;
        }else{
            workingEvent.meal.mealCount = parseInt(WAS_MEAL_PLAN) + DELTA_MEAL_PLAN;
        }
    }
    if (ADJ_ATTENDANCE) {
        const DELTA_ATTENDANCE = parseInt(request.adjustments.attendance);
        if((parseInt(WAS_ATTENDANCE) + DELTA_ATTENDANCE)< 1) {
            workingEvent.attendance = 0;
        }else{
            workingEvent.attendance = parseInt(WAS_ATTENDANCE) + DELTA_ATTENDANCE;
        }
    }
    if (ADJ_MEALS_FED) {
        const DELTA_MEALS_FED = parseInt(request.adjustments.mealsServed);
        if((parseInt(WAS_MEALS_FED) + DELTA_MEALS_FED)< 1) {
            workingEvent.meal.mealsServed = 0;
        }else{
            workingEvent.meal.mealsServed = parseInt(WAS_MEALS_FED) + DELTA_MEALS_FED;
        }
    }
    // return workingEvent;
    //now save the event, build the request
    
    const UPDATED_REGISTRATION = {
        TableName: 'p8Events',
        Item: workingEvent,
    };
    console.log('vvvvvvvvvvvvvvvvvv');
    console.log(UPDATED_REGISTRATION);
    console.log('^^^^^^^^^^^^^^^^^');
    try {
        async function updateTheRegistration() {
            let results = await dynamo.put(UPDATED_REGISTRATION).promise();
            console.log('it worked');
            return UPDATED_REGISTRATION;
        }
        updateTheRegistration();
    }catch(error){
        console.log('ERROR DURING UPDATE')
        return error;
    }
    // updateTheRegistration();

    // let response = {
    //     reg: adjReg,
    //     meal: adjMeal,
    //     attend: adjAttend,
    //     fed: adjServed,
    // };
    // return results;
}
