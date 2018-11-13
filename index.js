/*Build API for pizza delivery company. Create Users, tokens, checks and
  integrate API for accepting payments and sending email
*/

//load dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const Decoder = require('string_decoder').StringDecoder;
const routerHandlers = require('./lib/routeHandlers');



//create http server function
const server = http.createServer(function(req, res){
  //get url user is navigating to
  const parsedUrl = url.parse(req.url, true);

  //get parsed url and get its query string
  const queryString = parsedUrl.query;

  //get path name from parsed url 
  const pathName = parsedUrl.path;

  //trim path name of non-necessities
  const trimmedName = pathName.replace(/^\/+|\/+$/g, '');

  //get method requested by user
  const method = req.method.toLowerCase();

  const headers = req.headers;

  //initialize user's payload to a string
  let payloadString = '';
  
  //initialize decoder for payload;
  const decoder = new Decoder('utf-8')

  req.on('data', function(data){
    payloadString += decoder.write(data);

  })

  
  req.on('end', function(){
    payloadString += decoder.end();

    //get selected router, default to not found if a non-existent route is selected
    const selectedRouter = typeof router[trimmedName] !== undefined ? router[trimmedName] : routeHandlers.pathNotFound;

    //fill the data object with information gotten from request
    data = {
      'trimmedName': trimmedName,
      'queryString': queryString,
      'method': method,
      'headers': headers,
      'payload': payloadString,

    }

    //construct function for selected router with data object to get JSON payload and status code
    selectedRouter(data, function(statusCode, payload){
      statusCode = typeof statusCode === 'number' ? statusCode : 200;
      payload = typeof payload === 'object' ? payload : {};

      payloadString = JSON.stringify(payload);

      //set response header as JSON content-type
      res.setHeader('Content-Type', 'application.json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('The server is running on port 2000 with these responses: ', statusCode, queryString)
    })

  })
})

//define available routes and their handlers
 const router = {
  'users': routeHandlers.users,
  'tokens': routeHandlers.tokens,
  'checks': routeHandlers.checks
}

//start up server and set it listen on port 2000
server.listen(2000, function(){
  console.log('server started and running on port 2000');
})