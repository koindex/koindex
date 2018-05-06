'use strict';

/* globals describe, expect, it, beforeEach, afterEach */

var app = require('../..');
import request from 'supertest';

var newTrade;

describe('Trade API:', function() {
    describe('GET /api/trades', function() {
        var trades;

        beforeEach(function(done) {
            request(app)
        .get('/api/trades')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
            if(err) {
                return done(err);
            }
            trades = res.body;
            done();
        });
        });

        it('should respond with JSON array', function() {
            expect(trades).to.be.instanceOf(Array);
        });
    });

    describe('POST /api/trades', function() {
        beforeEach(function(done) {
            request(app)
        .post('/api/trades')
        .send({
            name: 'New Trade',
            info: 'This is the brand new trade!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
            if(err) {
                return done(err);
            }
            newTrade = res.body;
            done();
        });
        });

        it('should respond with the newly created trade', function() {
            expect(newTrade.name).to.equal('New Trade');
            expect(newTrade.info).to.equal('This is the brand new trade!!!');
        });
    });

    describe('GET /api/trades/:id', function() {
        var trade;

        beforeEach(function(done) {
            request(app)
        .get(`/api/trades/${newTrade._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
            if(err) {
                return done(err);
            }
            trade = res.body;
            done();
        });
        });

        afterEach(function() {
            trade = {};
        });

        it('should respond with the requested trade', function() {
            expect(trade.name).to.equal('New Trade');
            expect(trade.info).to.equal('This is the brand new trade!!!');
        });
    });

    describe('PUT /api/trades/:id', function() {
        var updatedTrade;

        beforeEach(function(done) {
            request(app)
        .put(`/api/trades/${newTrade._id}`)
        .send({
            name: 'Updated Trade',
            info: 'This is the updated trade!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
            if(err) {
                return done(err);
            }
            updatedTrade = res.body;
            done();
        });
        });

        afterEach(function() {
            updatedTrade = {};
        });

        it('should respond with the updated trade', function() {
            expect(updatedTrade.name).to.equal('Updated Trade');
            expect(updatedTrade.info).to.equal('This is the updated trade!!!');
        });

        it('should respond with the updated trade on a subsequent GET', function(done) {
            request(app)
        .get(`/api/trades/${newTrade._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
            if(err) {
                return done(err);
            }
            let trade = res.body;

            expect(trade.name).to.equal('Updated Trade');
            expect(trade.info).to.equal('This is the updated trade!!!');

            done();
        });
        });
    });

    describe('PATCH /api/trades/:id', function() {
        var patchedTrade;

        beforeEach(function(done) {
            request(app)
        .patch(`/api/trades/${newTrade._id}`)
        .send([
          { op: 'replace', path: '/name', value: 'Patched Trade' },
          { op: 'replace', path: '/info', value: 'This is the patched trade!!!' }
        ])
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
            if(err) {
                return done(err);
            }
            patchedTrade = res.body;
            done();
        });
        });

        afterEach(function() {
            patchedTrade = {};
        });

        it('should respond with the patched trade', function() {
            expect(patchedTrade.name).to.equal('Patched Trade');
            expect(patchedTrade.info).to.equal('This is the patched trade!!!');
        });
    });

    describe('DELETE /api/trades/:id', function() {
        it('should respond with 204 on successful removal', function(done) {
            request(app)
        .delete(`/api/trades/${newTrade._id}`)
        .expect(204)
        .end(err => {
            if(err) {
                return done(err);
            }
            done();
        });
        });

        it('should respond with 404 when trade does not exist', function(done) {
            request(app)
        .delete(`/api/trades/${newTrade._id}`)
        .expect(404)
        .end(err => {
            if(err) {
                return done(err);
            }
            done();
        });
        });
    });
});
