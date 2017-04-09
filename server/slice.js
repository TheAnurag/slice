const  _ = require('lodash');
const config = require('./config');
const debug = require('debug')('app:slice');
const Starling = require('starling-developer-sdk');
const starlingApiWrapper = require('./starling-api-wrapper');


const starlingClient = new Starling({apiUrl: config.sandboxApi});

const bat = "lEopA69vWM7ssG919Urm10A9lsJs3WwmbuM8A2wNPEmv73rxMkluGDUPMABkBfkv";
const lat = "9pKozZLPYdg6PKu0oZRJm8XLFj5sFJScCc57zY01kCSBNwNtWpWgoT30iCxzw2vX";
const sat = "VbqqwTokzpsyC61f4cN4VsUL28aTcw4SJzGF35NxhSw4A7NENziot48DxPqqiUuo";

const RATE = 3.29;
const FEE = 0;
global.potSize = 0;
global.potBalance = 0;
global.loans = [];
global.loanSize=0;

const init = (req, res) => {
  var promise = starlingClient.getBalance(sat);
  return promise.then(function(value) {
    var balance = _.get(value, "data", []);
    global.potSize = balance.clearedBalance;
    global.potBalance = balance.clearedBalance;
    res.json({success: true, slice : global.potSize });
  }).catch((e) => {
    debug('Error getting result', e);
    return null;
  });
};

const getLendings = (req, res) => {
  var loans = [];
  for(var i=0; i<global.loans.length ;i++){
    var loan = global.loans[i];
    var installment = loan.amount*(1+loan.rate*loan.term/1200)/loan.term;
    var installments = {"09/05/2017": installment, "09/06/2017": installment, "09/07/2017": installment};
    loans[i]={amount: loan.amount, rate: loan.rate, term: loan.term, installments: installments};
  }
  res.json({success: true, potTotal : getPotTotal(), potBalance: getPotBalance(), loans: loans});
};

const getLoans = (req, res) => {
  var loans = [];
  for(var i=0; i<global.loans.length ;i++){
    var loan = global.loans[i];
    var installment = loan.amount*(1+loan.rate*loan.term/1200)/loan.term;
    var installments = {"09/05/2017": installment + FEE, "09/06/2017": installment, "09/07/2017": installment};
    loans[i]={amount: loan.amount, rate: loan.rate, term: loan.term, installments: installments};
  }
  res.json({success: true, loans: loans});
};

const addDummy = (req, res) => {
  global.loans[global.loanSize] = {amount: 200, rate: RATE, term: 3};
  global.loanSize+=1;
  debug(global.loans);
  res.json({success:true})
};

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
  return global.potSize;
}

const getPotBalance = () =>{
  return global.potBalance;
}

const addToPot = (req, res) => {
  debug("adding to pot");
  var promise = starlingClient.getBalance(lat);
  promise.then(function(balanceResponse) {
        var balance = _.get(balanceResponse, "data", []);
        if(req.query.amount<balance.clearedBalance){
          starlingClient.makeLocalPayment(lat, "929500c6-64de-4193-8b17-2c03946fc1cd", "Slice", req.query.amount)
          .then(function (paymentResponse){
            debug(paymentResponse);
            global.potSize= (global.potSize -0)+ (req.query.amount-0);
            global.potBalance= (global.potBalance -0)+ (req.query.amount-0);
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



const borrowResponse = function(accessToken, req, res) {
    var promise = starlingClient.getBalance(accessToken);
    return promise.then(function(value) {
        var balance = _.get(value, "data", []);
        var installment = req.query.amount*(1+(RATE)/400)/3;
        res.json({ 
          success: true, 
          balance: balance.clearedBalance, 
          potTotal : getPotTotal(), 
          potBalance: getPotBalance(), 
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
          starlingClient.makeLocalPayment(sat, "b3a18bf3-4834-48ca-812f-2183f0436890", "Slice Loan", req.query.amount)
          .then(function (paymentResponse){
            debug(paymentResponse);
            global.potBalance= global.potBalance - req.query.amount;
            //create standing instructions
            global.loans[global.loanSize] = {amount: req.query.amount, rate: RATE, term: 3};
            global.loanSize+=1;
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
  app.get('/api/slice/init', (req, res) => init(req, res) );
  app.get('/api/slice/getLendings', (req, res) => getLendings(req, res) );
  app.get('/api/slice/getLoans', (req, res) => getLoans(req, res) );
  app.get('/api/slice/add', (req, res) => addToPot(req, res) );
  app.get('/api/slice/borrow', (req, res) => borrow(req, res) );
  app.get('/api/slice/addDummy', (req, res) => addDummy(req, res) );
};
module.exports = { start };