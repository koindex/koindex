/**
 * Trade model events
 */

'use strict';

import {EventEmitter} from 'events';
var Trade = require('../../sqldb').Trade;
var TradeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TradeEvents.setMaxListeners(0);

// Model events
var events = {
    afterCreate: 'save',
    afterUpdate: 'save',
    afterDestroy: 'remove'
};

// Register the event emitter to the model events
function registerEvents(Trade) {
    for(var e in events) {
        let event = events[e];
        Trade.hook(e, emitEvent(event));
    }
}

function emitEvent(event) {
    return function(doc, options, done) {
        TradeEvents.emit(`${event}:${doc._id}`, doc);
        TradeEvents.emit(event, doc);
        done(null);
    };
}

registerEvents(Trade);
export default TradeEvents;
