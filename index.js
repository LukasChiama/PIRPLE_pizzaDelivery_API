/*Build API for pizza delivery company. Create Users, tokens, checks and
  integrate API for accepting payments and sending email
*/

//load dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const Decoder = require('string_decoder').StringDecoder;
const fs = require("fs");
const path = require("path");
const routeHandlers = require('./lib/routeHandlers');
const aux = require('./lib/auxFunctions');


//define .env file and make it a global variable populated with API Keys, hashing secret for tokens and other secrets needed for the code
const envFile = path.resolve(__dirname, '.env')
//after getting the file, read the fikle contents,
//then make them keys and values of the node.js global process.env
const envVariables = fs.readFileSync(envFile, 'utf-8').split('\n')
envVariables.reduce((acc, item) => {
  const [key, value] = item.split('=');
  process.env[key] = value.replace("\r", '');
  return acc;
}, {})


//instantiate the https server
const httpsServer = https.createServer(
  (req, res) => unifiedServer(req, res))

//read from key and certificate for https route
httpsOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/certificate.pem')
};

//start up the https server
httpsServer.listen(+process.env.HttpsPort, function () {
  console.log(`HTTPS server started and running on port ${+process.env.HttpsPort}`);
})

//create http server function
const httpServer = http.createServer(
  (req, res) => unifiedServer(req, res));


//start up  the http server
httpServer.listen(+process.env.HttpPort, function () {
  console.log(`HTTP server started and running on port ${+process.env.HttpPort}`);
})


//all server logic goes in here
const unifiedServer = function (req, res) {
  //get url user is navigating to
  const parsedUrl = url.parse(req.url, true);

  //get parsed url and get its query string
  const queryString = parsedUrl.query;

  //get path name from parsed url 
  const pathName = parsedUrl.pathname;

  //trim path name of non-necessities
  const trimmedName = pathName.replace(/^\/+|\/+$/g, '');

  //get method requested by user
  const method = req.method.toLowerCase();

  const headers = req.headers;

  //initialize user's payload to a string
  let payloadString = '';

  //initialize decoder for payload;
  const decoder = new Decoder('utf-8')

  req.on('data', function (data) {
    payloadString += decoder.write(data);

  })


  req.on('end', function () {
    payloadString += decoder.end();

    //get selected router, default to not found if a non-existent route is selected
    const selectedRouter = typeof router[trimmedName] !== 'undefined' ? router[trimmedName] : routeHandlers.pathNotFound;

    //fill the data object with information gotten from request
    const data = {
      'trimmedName': trimmedName,
      'queryString': queryString,
      'method': method,
      'headers': headers,
      'payload': aux.parseJsonToObject(payloadString),

    }

    //construct function for selected router with data object to get JSON payload and status code
    selectedRouter(data, function (statusCode, payload) {
      statusCode = typeof statusCode === 'number' ? statusCode : 200;
      payload = typeof payload === 'object' ? payload : {};

      payloadString = JSON.stringify(payload);

      //set response header as JSON content-type
      res.setHeader('Content-Type', 'application.json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('The server is running with this response: ', statusCode)
    })

  })
}

//define available routes and their handlers
const router = {
  'users': routeHandlers.users,
  'tokens': routeHandlers.tokens,
  'menu': routeHandlers.menu,
  'shop': routeHandlers.shop,
  'checkout': routeHandlers.checkout
}
