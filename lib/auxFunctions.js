/* craft functions that will perform auxilliary functions
 that will allow other functions do their duty*/

//load dependencies
const crypto = require('crypto');
const https = require("https");
const querystring = require("querystring");
const config = require("./config");

const aux = {};


//define function that will json into objects
aux.parseJsonToObject = function (str) {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
}

//define function that will hash password using the crypto library. This will allow for encrypting passwords
aux.hashPassword = function (str) {
  const hash = crypto.createHmac("SHA256", config.hashingSecret).update(str).digest('hex');
  return hash;
}

//define function that will return a random string of characters that will serve as login token and order Id
aux.createToken = function (num) {
  num = typeof num === 'number' && num > 0 ? num : false;
  if (num) {
    //define possible characters for use in generating the string
    const posChar = '010234abcdefghijklmno56789pqrstuvwxyz';
    let str = '';
    //use a for loop to randomly select characters from the list of possible characters
    for (i = 0; i < num; i++) {
      randomChar = posChar.charAt(Math.floor(Math.random() * posChar.length));
      //add randomly selected character to the string being created till it gets to the desired length
      str += randomChar;
    }
    //return the new string to the function that called for it
    return str;

  } else {
    return false;
  }
}

//define function that will take in customer's credit card details and make a charge for the pizzas ordered
aux.makeStripeCharge = function (email, charge, cb) {
  if (email && charge) {

    //define charge parameters
    const chargeData = {
      "amount": charge,
      "currency": "usd",
      "source": config.stripe.source,
      "description": "charge for" + email,
    }
    //stringify the data for making the request
    const stringData = querystring.stringify(chargeData)

    //craft the api request
    const request = {
      "protocol": "https:",
      "hostname": "api.stripe.com",
      "method": "POST",
      "path": "/v1/charges",
      "auth": config.stripe.auth,
      "headers": {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringData)
      }
    }

    //make the request using the https protocol
    let req = https.request(request, (res) => {
      res.setEncoding('utf8');
      res.on('data', (data) => {
        const responseObject = aux.parseJsonToObject(data);
        if (responseObject.id) {
          cb(false, responseObject.id);
        } else {
          cb('Request not successful; could not get id from request ID from stripe');
        }
      });
    });

    //bind the error event to prevent throwing
    req.on('error', (e) => {
      cb(e)
    });

    req.write(stringData);

    req.end();

  } else {
    cb("No email and charge provided")
  }
}

//define function that will send off an email to customers with their order receipt
aux.sendEmail = function (email, charge, orderId, cb) {
  const message = 'Your pizza order with orderId: ' + orderId + ' and cost of $' + charge + ' has been successfully charged to your credit card. Thank you for your continued patronage. Best Pizzas!';

  //stringify parameters for making api call
  const emailData = querystring.stringify({
    'from': 'postmaster@' + config.mailGun.domainName,
    'to': email,
    'subject': 'Pizza order Receipt. Id: ' + orderId,
    'text': message,
  });

  //craft the api call
  const request = {
    'protocol': 'https:',
    'hostname': 'api.mailgun.net',
    'method': 'POST',
    'path': '/v3/'+ config.mailGun.domainName+'/messages',
    'auth': config.mailGun.auth,
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(emailData)
    }
  }

  const req = https.request(request, function (res) {
    const status = res.statusCode;

    if (status === 200 || status === 201) {
      cb(false)
    } else {
      cb('Status code returned ' + status)
    }
  });

  req.on('error', (e) => {
    cb(e)
  });

  req.write(emailData);

  req.end();
}


module.exports = aux;