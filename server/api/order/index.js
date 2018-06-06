'use strict';

var express = require('express');
var controller = require('./order.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/id/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);
router.get('/user/:id', controller.getByUserId);
router.get('/new/:pair', controller.getNewOrdersByPair);
router.get('/filled/:pair', controller.findFilledOrdersByPair);
router.put('/cancel', controller.updateCancelledOrders);

module.exports = router;
