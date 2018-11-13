//load dependencies for route handlers library
const _data = require('./data');
const aux = require('./auxFunctions');

//create routeHandlers object
routeHandlers = {};

//define allowed methods and call relevant function for selected method
routeHandlers.users = function (data, callback) {
  const allowedMethods = ['post', 'get', 'put', 'delete'];
  if(allowedMethods.indexOf(data.method) > -1 ) {
    routeHandlers._users[data.method](data, callback)
  } else {
    callback(504)
  }
}

routeHandlers._users = {};

//function for handling post requests
//required fields = fullname, email address, address & password
routeHandlers._users.post = function(data, callback) {
  const firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0  && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  const address = typeof data.payload.address === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  const password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  //check to see the user provided all required fields
  if (firstName && lastName && email && address && password) {
    //read from users to confirm email does not already exist. Flag an error if it does
    _data.read('users', email, function(err) {
      if (err) {
        //hash the user's password
        const hashedPwd = aux.hashPassword(password);
        if (hashedPwd) {

          //create an object to hold user data
          const userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'email': email,
            'address' : address,
            'password' : hashedPwd
          }

          //write the data to the users directory
          _data.create('users', email, userObject, function(err) {
            if (!err) {
              callback(200)
            } else {
              callback(500, {'Error': 'Could not write new user to directory'})
            }
          })
        } else {
          callback(400, {'Error': 'Could not hash user\'s password'})
        }
      } else {
        callback(400, {'Error': 'A user with the provided email address exists. Please select another email address'})
      }
    })
  } else {
    callback(400, {'Error': 'Required fields are missing or invalid'})
  }
}


//function for handling get requests on users
//required fields = email address
routeHandlers._users.get = function (data, callback) {
  const email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0  && data.queryString.email.includes('@') && data.queryString.email.includes('.') ? data.queryString.email.trim() : false;


}

//export routeHandlers library
module.exports = routeHandlers;