/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/orders              ->  index
 * POST    /api/orders              ->  create
 * GET     /api/orders/:id          ->  show
 * PUT     /api/orders/:id          ->  upsert
 * PATCH   /api/orders/:id          ->  patch
 * DELETE  /api/orders/:id          ->  destroy
 */


//INSERT INTO "Trades" ("trade_id","bid_id","ask_id","price","volumn","pair") VALUES (DEFAULT,1,2,12.3,10.4,'USD-ETH')
//INSERT INTO "Orders" ("order_id","user_id","price", "volumn", "state","pair","order_type") VALUES (DEFAULT,1,2.23,12.3,1,'USD-ETH')
'use strict';

import { applyPatch } from 'fast-json-patch';
import { Order } from '../../sqldb';
import redis from '../../components/redis';

import * as trade from '../trade/trade.controller';
import * as utils from '../../components/utils';
import moment from 'moment';

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function(entity) {
        if(entity) {
            return res.status(statusCode)
                .json(entity);
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
                .then(() => res.status(204)
                    .end());
        }
    };
}

function handleEntityNotFound(res) {
    return function(entity) {
        if(!entity) {
            res.status(404)
                .end();
            return null;
        }
        return entity;
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function(err) {
        res.status(statusCode)
            .send(err);
    };
}

function getSetTop(setName, descending) {
    return new Promise((resolve, reject) => {
        let position;
        if(descending === true) {
            position = -1;
        } else {
            position = 0;
        }
        redis.zrange(setName, position, position, (err, result) => {
            if(err) {
                // handle error case here
                reject(err);
            } else if(result === undefined || result.length === 0) {
                resolve(result);
            } else {
                resolve(JSON.parse(result));
            }
        });
    });
}

function removeSetTop(setName, descending) {
    return new Promise((resolve, reject) => {
        let position;
        if(descending === true) {
            position = -1;
        } else {
            position = 0;
        }
        redis.zremrangebyrank(setName, position, position, (err, reply) => {
            if(err) {
                // handle error case here
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}

function addToSet(setName, price, quantity, status, userId, id = null) {
    return new Promise((resolve, reject) => {
        let orderId;
        if(id === null) {
            orderId = utils.generateHash();
        } else {
            orderId = id;
        }
        let orderCreationTime = moment().unix();
        redis.zadd(setName, price, JSON.stringify({id: orderId, price: price, volume: quantity, userId: userId, status: status, timestamp: orderCreationTime}), err => {
            if(err) {
                //handle error case here
                reject(err);
            }
        });
        resolve(orderId);
    });
}

async function matchOrder(pair, price, quantity, side, type, userId) {
    let makerDirection;
    let takerDirection;
    let isDescending;
    let isBidUserTaker;
    if(side === 'BUY') {
        makerDirection = `BIDSET_${pair}`;
        takerDirection = `ASKSET_${pair}`;
        isDescending = false;
        isBidUserTaker = false;
    } else if(side === 'SELL') {
        makerDirection = `ASKSET_${pair}`;
        takerDirection = `BIDSET_${pair}`;
        isDescending = true;
        isBidUserTaker = true;
    } else {
        throw new Error('Invalid side information');
    }

    let body = {};
    body.pair = pair;
    body.transactTime = moment().unix();

    if(type === 'LIMIT') {
        let topOfSetOrder = await getSetTop(takerDirection, isDescending);
        if(topOfSetOrder.length === 0 || price < topOfSetOrder.price && side === 'BUY' || price > topOfSetOrder.price && side === 'SELL') {
            //Maker
            body.orderId = await addToSet(makerDirection, price, quantity, 'NEW', userId);
        } else {
            // Taker
            let takerOrderId = utils.generateHash();
            body.orderId = takerOrderId;
            while(quantity > 0) {
                // We sold all orders above the input price but still have some quantity left so we make a new order
                if(topOfSetOrder.length === 0 || price < topOfSetOrder.price && side === 'BUY' || price > topOfSetOrder.price && side === 'SELL') {
                    await addToSet(makerDirection, price, quantity, 'NEW', userId);
                    break;
                }
                await removeSetTop(takerDirection, isDescending);
                // Last one is partial fill so push back up
                if(quantity - topOfSetOrder.volumn < 0) {
                    await addToSet(takerDirection, topOfSetOrder.price, topOfSetOrder.volumn - quantity, 'PARTIAL', topOfSetOrder.userId, topOfSetOrder.id);
                    await trade.addToTrade(pair, topOfSetOrder.price, quantity, topOfSetOrder.userId, userId, topOfSetOrder.id, takerOrderId, isBidUserTaker);
                    break;
                }
                quantity -= topOfSetOrder.volumn;
                await trade.addToTrade(pair, topOfSetOrder.price, topOfSetOrder.volumn, topOfSetOrder.userId, userId, topOfSetOrder.id, takerOrderId, isBidUserTaker);
                topOfSetOrder = await getSetTop(takerDirection, isDescending);
            }
        }
    } else if(type === 'MARKET') {
        let topOfSetOrder = await getSetTop(takerDirection, isDescending);
        if(topOfSetOrder.length === 0) {
            throw new Error('No orders left');
        }
        let takerOrderId = utils.generateHash();
        body.orderId = takerOrderId;
        while(quantity > 0) {
            await removeSetTop(takerDirection, isDescending);
            // Last one is partial fill so push back up
            if(quantity - topOfSetOrder.volumn < 0) {
                await addToSet(takerDirection, topOfSetOrder.price, topOfSetOrder.volumn - quantity, 'PARTIAL', topOfSetOrder.userId, topOfSetOrder.id);
                await trade.addToTrade(pair, topOfSetOrder.price, quantity, topOfSetOrder.userId, userId, topOfSetOrder.id, takerOrderId, isBidUserTaker);
                break;
            }
            quantity -= topOfSetOrder.volumn;
            await trade.addToTrade(pair, topOfSetOrder.price, topOfSetOrder.volumn, topOfSetOrder.userId, userId, topOfSetOrder.id, takerOrderId, isBidUserTaker);
            topOfSetOrder = await getSetTop(takerDirection, isDescending);
        }
    } else {
        throw new Error('Order type error');
    }
    return body;
}

// Gets a list of orders
export function index(req, res) {
    return Order.findAll()
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single order from the DB
export function show(req, res) {
    return Order.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

export async function create(req, res) {
    // Get from req body and check if body is correct
    let reqBody = req.body;
    if(!reqBody.hasOwnProperty('pair')) {
        return res.status(400)
            .json({message: 'Pair missing in the request body'});
    }
    if(!reqBody.hasOwnProperty('side')) {
        return res.status(400)
            .json({message: 'Side missing in the request body'});
    }
    if(!reqBody.hasOwnProperty('type')) {
        return res.status(400)
            .json({message: 'Type missing in the request body'});
    }
    if(!reqBody.hasOwnProperty('quantity')) {
        return res.status(400)
            .json({message: 'Quantity in force missing in the request body'});
    }
    if(!reqBody.hasOwnProperty('timestamp')) {
        return res.status(400)
            .json({message: 'Timestamp in force missing in the request body'});
    }
    if(reqBody.type === 'LIMIT' || reqBody.type === 'LIMIT_MAKER') {
        if(!reqBody.hasOwnProperty('price')) {
            return res.status(400)
                .json({message: 'Price missing in the request body'});
        }
    }
    if(reqBody.type === 'LIMIT') {
        if(!reqBody.hasOwnProperty('timeInForce')) {
            return res.status(400)
                .json({message: 'Time in force missing in the request body'});
        }
    }

    // 1) Check if user has sufficient fund
    // TODO: use apikey to lookup userId
    let userId = 15;
    //let fundRequiredToMakeOrder = reqBody.price * reqBody.quantity;
    // if(user.checkBalance(userId) < fundRequiredToMakeOrder) {
    //     return res.status(400)
    //         .json({message: 'Insufficient balance to make order'});
    // }

    // 2) Run trading matching
    try {
        let mssg = await matchOrder(reqBody.pair, reqBody.price, reqBody.quantity, reqBody.side, reqBody.type, userId);
        return res.status(200)
            .json(mssg);
    } catch(err) {
        return res.status(400)
            .json({message: err.message});
    }
}

export function upsert(req, res) {
// get parameters from database
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }

    return Order.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Updates an existing order in the DB
export function patch(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Order.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a order from the DB
export function destroy(req, res) {
    return Order.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}

export function getByUserId(req, res) {
    return Order.findAll({
        where: {
            user_id: req.params.User_id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

//fire a call to database.
export function findFilledByPair(req, res) {
    return Order.findAll({
        where: {
            pair: req.params.pair,
            order_status: 'FILLED'
        }
    })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}


export function findFilledOrdersByPair(req, res) {
    let pair = req.params.pair;

    const askPromise = getFromSetByPair('ask',pair);
    askPromise.then(function getTradeSet(tradeSet){
        res.send(tradeSet);
    }).catch(function handleErrors(error) {
        console.log(error);
    });
}


export function getNewOrdersByPair(req, res) {
    let pair = req.params.pair;
    let orders = {};

    const askPromise = getFromSetByPair('ask',pair);
    askPromise.then(function getAskSet(askSet){
        orders.ask = askSet;
        const bidPromise = getFromSetByPair('bid', pair);
        bidPromise.then(function getBidSet(bidSet) {
            orders.bid = bidSet;
            res.send(orders);
        }).catch(function handleErrors(error) {
            console.log(error);
        });
    }).catch(function handleErrors(error) {
        console.log(error);
    });
}

// Update a cancelled order from the DB
export function updateCancelledOrders(req, res) {
    console.log(req.body);
    let orderId = req.body.id;
    let pair = req.body.pair;
    let side = req.body.side;

    const promise = matchOrderFromSetById(side, pair, orderId);
    promise.then(function getTarget(target) {
        const targetPromise = removeFromSet(side, pair,target);
        targetPromise.then(function callback(msg) {
            res.send(msg);
        }).catch(function handleErrors(error) {
            console.log(error);
        });
    }).catch(function handleErrors(error) {
        console.log(error);
    });
}


function getFromSetByPair(side, pair) {
    return new Promise((resolve, reject) => {
        redis.zrange(side.toUpperCase() + 'SET_' + pair.toUpperCase(), 0, -1, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    });
}

function matchOrderFromSetById(side, pair, orderId) {
    return new Promise((resolve, reject) => {
        redis.zscan(side.toUpperCase() + 'SET_' + pair, 0, 'MATCH', '*' + orderId + '*', (err, result) => {
            if(err) {
                reject(err);
            } else {
                resolve(result[1][0]);
            }
        });
    });
}

function removeFromSet(side, pair, target) {
    return new Promise((resolve, reject) => {
        redis.zrem(side.toUpperCase() + 'SET_' + pair, target,(err, result) => {
            if(err) {
                reject(err);
            } else {
                const msg = 'Order is cancelled successfully.';
                resolve(msg);
            }
        });
    });
}

/*return Order.upsert({
                order_status: 'CANCELED'}, {
                where: {
                    _id: orderId
                }
            });*/
