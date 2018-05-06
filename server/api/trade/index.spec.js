'use strict';

/* globals sinon, describe, expect, it */

var proxyquire = require('proxyquire').noPreserveCache();

var tradeCtrlStub = {
    index: 'tradeCtrl.index',
    show: 'tradeCtrl.show',
    create: 'tradeCtrl.create',
    upsert: 'tradeCtrl.upsert',
    patch: 'tradeCtrl.patch',
    destroy: 'tradeCtrl.destroy'
};

var routerStub = {
    get: sinon.spy(),
    put: sinon.spy(),
    patch: sinon.spy(),
    post: sinon.spy(),
    delete: sinon.spy()
};

// require the index with our stubbed out modules
var tradeIndex = proxyquire('./index.js', {
    express: {
        Router() {
            return routerStub;
        }
    },
    './trade.controller': tradeCtrlStub
});

describe('Trade API Router:', function() {
    it('should return an express router instance', function() {
        expect(tradeIndex).to.equal(routerStub);
    });

    describe('GET /api/trades', function() {
        it('should route to trade.controller.index', function() {
            expect(routerStub.get
        .withArgs('/', 'tradeCtrl.index')
        ).to.have.been.calledOnce;
        });
    });

    describe('GET /api/trades/:id', function() {
        it('should route to trade.controller.show', function() {
            expect(routerStub.get
        .withArgs('/:id', 'tradeCtrl.show')
        ).to.have.been.calledOnce;
        });
    });

    describe('POST /api/trades', function() {
        it('should route to trade.controller.create', function() {
            expect(routerStub.post
        .withArgs('/', 'tradeCtrl.create')
        ).to.have.been.calledOnce;
        });
    });

    describe('PUT /api/trades/:id', function() {
        it('should route to trade.controller.upsert', function() {
            expect(routerStub.put
        .withArgs('/:id', 'tradeCtrl.upsert')
        ).to.have.been.calledOnce;
        });
    });

    describe('PATCH /api/trades/:id', function() {
        it('should route to trade.controller.patch', function() {
            expect(routerStub.patch
        .withArgs('/:id', 'tradeCtrl.patch')
        ).to.have.been.calledOnce;
        });
    });

    describe('DELETE /api/trades/:id', function() {
        it('should route to trade.controller.destroy', function() {
            expect(routerStub.delete
        .withArgs('/:id', 'tradeCtrl.destroy')
        ).to.have.been.calledOnce;
        });
    });
});
