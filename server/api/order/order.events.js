/**
 * Order model events
 */

'use strict';

import {EventEmitter} from 'events';
var Order = require('../../sqldb').Order;
var OrderEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
OrderEvents.setMaxListeners(0);

// Model events
var events = {
    afterCreate: 'save',
    afterUpdate: 'save',
    afterDestroy: 'remove'
};

// Register the event emitter to the model events
function registerEvents(Order) {
    for(var e in events) {
        let event = events[e];
        Order.hook(e, emitEvent(event));
    }
}

function emitEvent(event) {
    return function(doc, options, done) {
        OrderEvents.emit(`${event}:${doc._id}`, doc);
        OrderEvents.emit(event, doc);
        done(null);
    };
}

registerEvents(Order);
export default OrderEvents;
