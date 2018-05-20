/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/trades              ->  index
 * POST    /api/trades              ->  create
 * GET     /api/trades/:id          ->  show
 * PUT     /api/trades/:id          ->  upsert
 * PATCH   /api/trades/:id          ->  patch
 * DELETE  /api/trades/:id          ->  destroy
 */

'use strict';

import { applyPatch } from 'fast-json-patch';
import {Trade} from '../../sqldb';
import redis from '../../components/redis';
import moment from 'moment';
import * as utils from '../../components/utils';

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function(entity) {
        if(entity) {
            return res.status(statusCode).json(entity);
        }
        return null;
    };
}

function patchUpdates(patches) {
    return function(entity) {
        try {
            applyPatch(entity, patches, /*validate*/ true);
        } catch(err) {
            return Promise.reject(err);
        }

        return entity.save();
    };
}

function removeEntity(res) {
    return function(entity) {
        if(entity) {
            return entity.destroy()
        .then(() => res.status(204).end());
        }
    };
}

function handleEntityNotFound(res) {
    return function(entity) {
        if(!entity) {
            res.status(404).end();
            return null;
        }
        return entity;
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function(err) {
        res.status(statusCode).send(err);
    };
}


export async function addToTrade(pair, price, quantity, takerUserId, makerUserId, takerOrderId, makerOrderId, isBidUserTaker) {
    return new Promise((resolve, reject) => {
        // if BidUserTaker then RED else GREEN
        let color;
        let bidUserId;
        let askUserId;
        let bidOrderId;
        let askOrderId;
        if(isBidUserTaker === true) {
            color = 'RED';
            bidUserId = takerUserId;
            askUserId = makerUserId;
            bidOrderId = takerOrderId;
            askOrderId = makerOrderId;
        } else {
            color = 'GREEN';
            bidUserId = makerUserId;
            askUserId = takerUserId;
            bidOrderId = makerOrderId;
            askOrderId = takerOrderId;
        }
        let timeOfTrade = moment()
            .unix();
        let tradeId = utils.generateHash();
        let insert = {
            price: price,
            volume: quantity,
            totalAmount: price * quantity,
            bidUserId: bidUserId,
            askUserId: askUserId,
            bidOrderId: bidOrderId,
            askOrderId: askOrderId,
            tradeId: tradeId,
            createdAt: timeOfTrade,
            color: color
        };
        redis.zadd(`TRADESET_${pair}`, timeOfTrade, JSON.stringify(insert), (err, reply) => {
            if(err) {
                //handle error case here
                reject(err);
            } else {
                // not necessary needed, it returns 0 after insertion.
                resolve(reply);
            }
        });
    });
}

// Gets a list of Trades
export function index(req, res) {
    return Trade.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Trade from the DB
export function show(req, res) {
    return Trade.find({
        where: {
            trade_id: req.params.id
        }
    })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Trade in the DB
export function create(req, res) {
    return Trade.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Trade in the DB at the specified ID
export function upsert(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }

    return Trade.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Trade in the DB
export function patch(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Trade.find({
        where: {
            _id: req.params.id
        }
    })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Trade from the DB
export function destroy(req, res) {
    return Trade.find({
        where: {
            _id: req.params.id
        }
    })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

export function findByPair(req, res) {
    return Trade.find({
        where: {
            pair: req.params.pair
        }
    })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}
