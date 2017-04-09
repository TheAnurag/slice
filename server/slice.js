const  _ = require('lodash');
const config = require('./config');
const debug = require('debug')('app:slice');
const Starling = require('starling-developer-sdk');
const starlingApiWrapper = require('./starling-api-wrapper');


const starlingClient = new Starling({apiUrl: config.sandboxApi});

const bcid = "1652ea50-f1e5-4f33-8964-827304b85cb8";
const bat = "co05hG6yZdFmYvowhGXmKdq5d617SvX8JqZrv7q9fWoJMU3sWgyMM3ntNsvL20Yo";
const brt = "gc3EVfBt7VJ0rqjMnVAnCLteLLFWcRcXPmfA0TAc9hyBWkN4sofVG8YU1uF2yFW6";
const baid = "";

const lcid = "4a6f8645-842f-4e43-b660-ea0ef75b86ca";
const lat = "1WP8aCSX6nWsyTNTz9JCqDz7RuZMp6cE96X3r015lzq2caB3pbuS93m6xTNFydX8";
const lrt = "izpornLFpq436qanJUrK1fXZW7Kqhx9iN0kJYXh29t6MGzFkzFBEPUyFd2TvUzMt";
const laid = "";


const scid = "b4dff24e-fe2c-49cd-a11d-6f552c308538";
const sat = "qEE1x6k1TP1xtRKYdRykobkrumsY0xM83xpVMPUdxwYqBj9kcvlta18cjbyaokmw";
const srt = "iqWZTiV0nULwF41Kbw9sS5YtMnPmwYVfhDTLa1zD9xwa6lrLTnoMorJimeAta70a";
const said = "";
var potSize = 0;
const RATE = 3.29;
const FEE = 0;

const checkBalanceAndAdd = function(promise, req, res, accessToken) {
    return 
};

const lenderResponse = function(success, accessToken, req, res) {
    var promise = starlingClient.getBalance(accessToken);
    return promise.then(function(value) {
        var balance = _.get(value, "data", []);
        res.json({ 
          success: success, 
          balance: balance.clearedBalance, 
          potTotal : getPotTotal(), 
          potBalance: getPotBalance(), 
          rate: RATE
        });
    }).catch((e) => {
      debug('Error getting result', e);
      return null;
    });
};

const getPotTotal =()=>{
  return 200;
}

const getPotBalance = () =>{
  return 100;
}

const addToPot = (req, res) => {
  debug("adding to pot");
  var promise = starlingClient.getBalance(lat);
  promise.then(function(balanceResponse) {
        var balance = _.get(balanceResponse, "data", []);
        if(req.query.amount<balance.clearedBalance){
          starlingClient.makeLocalPayment(lat, "378a02fd-af23-4b91-a281-3518996aadb0", "Slice", req.query.amount)
          .then(function (paymentResponse){
            debug(paymentResponse);
            lenderResponse(true, lat, req, res);
          }).catch((e) => {
              debug('Error making payment', e);
              return null;
          });
        }else{
          lenderResponse(false, lat, req, res);
        }
    }).catch((e) => {
      debug('Error getting result', e);
      return null;
    });
};

const getLendings = (req, res) => {
};

const getLoans = (req, res) => {
};

const borrowResponse = function(accessToken, req, res) {
    var promise = starlingClient.getBalance(accessToken);
    return promise.then(function(value) {
        var balance = _.get(value, "data", []);
        var installment = req.query.amount*(1+(RATE)/400)/3;
        res.json({ 
          success: true, 
          balance: balance.clearedBalance, 
          potTotal : 200, potBalance: 100, 
          rate: RATE,
          installments : {"09/05/2017": installment + FEE, "09/06/2017": installment, "09/07/2017": installment} 
        });
    }).catch((e) => {
      debug('Error getting result', e);
      return null;
    });
};

const borrow = (req, res) => {
  debug("Borrowing Money");
  var promise = starlingClient.getBalance(sat);
  promise.then(function(balanceResponse) {
        var balance = _.get(balanceResponse, "data", []);
        if(req.query.amount<balance.clearedBalance){
          starlingClient.makeLocalPayment(sat, "0ffb792a-acd9-47ec-ac64-cbdcd8a3cf83", "Slice Loan", req.query.amount)
          .then(function (paymentResponse){
            debug(paymentResponse);
            potSize+= req.query.amount;
            //create standing instructions
            borrowResponse(sat, req, res);
          }).catch((e) => {
              debug('Error making payment', e);
              return null;
          });
        }else{
          res.json({success: false, balance: balance.clearedBalance, potSize : potSize});
        }
    }).catch((e) => {
      debug('Error getting result', e);
      return null;
    });
};

const start = (app) => {
  debug('Starting slice app...');

  app.get('/api/slice/getLendings', (req, res) => getLendings(req, res) );
  app.get('/api/slice/getLoans', (req, res) => getLoans(req, res) );
  app.get('/api/slice/add', (req, res) => addToPot(req, res) );
  app.get('/api/slice/borrow', (req, res) => borrow(req, res) );
};
module.exports = { start };