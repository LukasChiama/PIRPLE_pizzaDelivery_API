//load dependencies for route handlers library
const _data = require('./data');
const aux = require('./auxFunctions');

//create routeHandlers object
routeHandlers = {};


//define a function to handle user requests and decide which operation to perform on token
routeHandlers.users = function (data, callback) {

  //define allowed methods and call relevant function for selected method
  const allowedMethods = ['post', 'get', 'put', 'delete'];

  //if method requested by user is one of the allowed methods then pass it on to the relevant function
  if (allowedMethods.indexOf(data.method) > -1) {
    routeHandlers._users[data.method](data, callback)

    //else callback 504
  } else {
    callback(405);
  }
}

routeHandlers._users = {};

//function for handling post requests
//required fields = fullname, email address, address & password
routeHandlers._users.post = function (data, callback) {
  const firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  const address = typeof data.payload.address === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  const password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  //check to see the user provided all required fields
  if (firstName && lastName && email && address && password) {
    //read from users to confirm email does not already exist. Flag an error if it does
    _data.read('users', email, function (err) {
      if (err) {
        //hash the user's password
        const hashedPwd = aux.hashPassword(password);
        if (hashedPwd) {

          //create an object to hold user data
          const userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'address': address,
            'password': hashedPwd
          }

          //write the data to the users directory
          _data.create('users', email, userObject, function (err) {
            if (!err) {
              callback(200)
            } else {
              callback(500, { 'Error': 'Could not write new user to directory' })
            }
          });
        } else {
          callback(400, { 'Error': 'Could not hash user\'s password' })
        }
      } else {
        callback(400, { 'Error': 'A user with the provided email address exists. Please select another email address' })
      }
    });
  } else {
    callback(400, { 'Error': 'Required fields are missing or invalid' })
  }
}


//function for handling get requests on users
//required fields = email address
routeHandlers._users.get = function (data, callback) {
  const email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 && data.queryString.email.includes('@') && data.queryString.email.includes('.') ? data.queryString.email.trim() : false;

  if (email) {

    //confirm that token provided in the header is valid and belongs to the user
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {

        _data.read('users', email, function (err, data) {
          if (!err && data) {
            delete data.hashedPwd;
            callback(200, data)
          } else {
            callback(400, { 'Error': 'Could not find specified user' })
          }
        });
      } else {
        callback(403, { 'Error': 'Provided token is either expired or invalid' })
      }
    });
  } else {
    callback(400, { 'Error': "Please provide required query!" })
  }
}


//function for updating user
//required fields: email address
//optional fields: first name, last name, address and password
routeHandlers._users.put = function (data, callback) {
  const firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  const address = typeof data.payload.address === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  const password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email) {

    //confirm that token provided in the header is valid and belongs to the user
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {

        //check if user provided an email. Flag error is no email was provided
        _data.read('users', email, function (err, data) {
          //check if the provided email matches any user in the database
          if (!err && data) {
            //check if user has provided at least one field for updating. Flag an error if not
            if (firstName || lastName || address || password) {
              //write in the new values provided by the user
              if (firstName) {
                data.firstName = firstName;
              }
              if (lastName) {
                data.lastName = lastName;
              }
              if (address) {
                data.address = address;
              }
              if (password) {
                data.hashedPwd = aux.hashPassword(password);
              }

              _data.update('users', email, data, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Could not update user' });
                }
              });
            } else {
              callback(400, { 'Error': 'Please provide additional field to update' })
            }
          } else {
            callback(400, { 'Error': 'Specified user not found. Please check provided email' })
          }
        });
      } else {
        callback(403, { 'Error': 'Provided token is expired or invalid' })
      }
    });
  } else {
    callback(400, { 'Error': 'Required email not provided. Please provide email to continue' })
  }
}


//function for deleting user
//required field: email
//optional field: none
routeHandlers._users.delete = function (data, callback) {
  const email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 && data.queryString.email.includes('@') && data.queryString.email.includes('.') ? data.queryString.email.trim() : false;

  //check to ensure user has provided valid email address
  if (email) {

    //confirm that token provided in the header is valid and belongs to the user
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {

        //confirm that email provided exists in the database if the token is valid
        _data.read('users', email, function (err, data) {
          if (!err && data) {

            //if user with provided email exists and there is associated data, then delete user
            _data.delete('users', email, function (err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, { 'Error': 'Could not delete specified user' })
              }
            })
          } else {
            callback(400, { 'Error': 'Specified user not found. Please check provided email' })
          }
        });
      } else {
        callback(403, { 'Error': 'Token provided is either expired, invalid or does not belong to the specified user' })
      }
    });
  } else {
    callback(400, { 'Error': 'Required email not provided. Please provide email to continue' })
  }
}

//write a function to handle token requests and decide which operation to perform on token
routeHandlers.tokens = function (data, callback) {
  //define allowed methods
  const allowedMethods = ['post', 'get', 'put', 'delete'];
  //determine the method selected by the user and send the request to the necessary function
  if (allowedMethods.indexOf(data.method) > -1) {
    routeHandlers._token[data.method](data, callback)
  } else {
    callback(504);
  }
}

routeHandlers._token = {};


//define function that will handle requests for creating tokens for registered users
//require fields: email address & password
//no optional fields
routeHandlers._token.post = function (data, callback) {
  const email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  const password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email && password) {

    //check that a user with the provided email address exists. Flag an error if not
    _data.read('users', email, function (err, data) {
      if (!err && data) {

        //hash provided password and confirm it matches the password associated with the user. This will ensure a token cannot be created with a wrong password
        const hashPword = aux.hashPassword(password);
        if (hashPword === data.password) {

          //create a token of length 20 if the password is a match
          const tokenId = aux.createToken(20);

          //set token expiry to 30 minutes from creation time
          const tokenExpiry = Date.now() + 1000 * 60 * 30;

          //create a token object to be saved to the directory
          const tokenObject = {
            'email': email,
            'id': tokenId,
            'tokenExpires': tokenExpiry
          }

          //save the object to the tokens directory
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create new token' })
            }
          })
        } else {
          callback(400, { 'Error': 'Provided password did not match user\'s stored password' })
        }
      } else {
        callback(400, { 'Error': 'User with specified details does not exist' })
      }
    })
  } else {
    callback(400, { 'Error': 'Required fields not provided' })
  }
}


//define function for getting tokens associated with a user
//required field: email
//no optional fields necessary
routeHandlers._token.get = function (data, callback) {
  const token = typeof data.queryString.token === 'string' && data.queryString.token.trim().length === 20 ? data.queryString.token.trim() : false;

  if (token) {

    //check tokens directory to confirm the provided token exists
    _data.read('tokens', token, function (err, data) {
      if (!err) {

        //if token is found then callback 200 and provide the user with token
        callback(200, data)
      } else {
        callback(404, { 'Error': 'Provided token not found' })
      }
    });
  } else {
    callback(400, { 'Error': 'User token is required for this request. Please provide it' })
  }
}


//define function for extending expiry time of token by an extra 30 minutes
//required fields: token and extends- a boolean
//no optional fields
routeHandlers._token.put = function (data, callback) {
  const token = typeof data.payload.token === 'string' && data.payload.token.trim().length >= 10 ? data.payload.token.trim() : false;
  const extend = typeof data.payload.extend === 'boolean' && data.payload.extend === true ? true : false;

  if (token && extend) {
    _data.read('tokens', token, function (err, data) {
      if (!err && data) {
        if (data.tokenExpires > Date.now()) {
          data.tokenExpires = Date.now() + 1000 * 60 * 30;

          _data.update('tokens', token, data, function (err) {
            if (!err) {
              callback(200)
            } else {
              callback(500, { 'Error': 'Could not update expiry' })
            }
          })
        } else {
          callback(400, { 'Error': 'Cannot update expired token' })
        }
      } else {
        callback(400, { 'Error': 'Specified token does not exist' })
      }
    })
  } else {
    callback(400, { 'Error': 'Required fields missing or invalid' })
  }
}


//define function for deleting tokens.
//require only token from user
routeHandlers._token.delete = function (data, callback) {
  const token = typeof data.queryString.token === 'string' && data.queryString.token.trim().length === 20 ? data.queryString.token.trim() : false;
  if (token) {

    //check to see if token provided is valid
    _data.read('tokens', token, function (err, data) {
      if (!err && data) {

        //if token is valid, then delete associated token data from the directory
        _data.delete('tokens', token, function (err) {
          if (!err) {

            //callback 200 if deletion was successful
            callback(200)
          } else {
            callback(500, { 'Error': 'Could not delete token' })
          }
        })
      } else {
        callback(400, { 'Error': 'Specified field not found' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
}


//define function for verifying that tokens aren't expired when they are used to perform operations on user data
//the function will accept token, email and a callback as parameters
routeHandlers._token.verifyToken = function (token, email, callback) {

  //check the directory to ensure the token exists
  _data.read('tokens', token, function (err, data) {
    if (!err && data) {

      //check provided email to confirm it matches the user email in the directory
      //check time of token expiry to confirm it hasn't expired already. Only continue if token expiry time is ahead of current time
      if (data.email === email && data.tokenExpires > Date.now()) {

        //if both conditions are met, then pass true on to the caller function, otherwise pass false
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  })
}

//if user provides an undefined path then return a 404- path not found!
routeHandlers.pathNotFound = function (data, callback) {
  callback(404);
}

//export routeHandlers library
module.exports = routeHandlers;