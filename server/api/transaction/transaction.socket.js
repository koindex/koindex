/**
 * Broadcast updates to client when the model changes
 */

'use strict';

import TransactionEvents from './transaction.events';

// Model events to emit
var events = ['save', 'remove'];

export function register(spark) {
  // Bind model events to socket events
    for(let event of events) {
        var listener = createListener(`transaction:${event}`, spark);

        TransactionEvents.on(event, listener);
        spark.on('disconnect', removeListener(event, listener));
    }
}


function createListener(event, spark) {
    return function(doc) {
        spark.emit(event, doc);
    };
}

function removeListener(event, listener) {
    return function() {
        TransactionEvents.removeListener(event, listener);
    };
}
