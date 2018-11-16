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
                data.password = aux.hashPassword(password);
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



//define a function that will return an object containig available Pizza menu items to a logged in user
//users will be able to choose from three flavors of Pizza that will be available at any given time of the day
//the function will only accept the get method and will require user email and valid token
routeHandlers.menu = function (data, callback) {
  if (data.method === 'get') {
    const email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 && data.queryString.email.includes('@') && data.queryString.email.includes('.') ? data.queryString.email.trim() : false;

    //check to ensure user has provided a valid email address
    if (email) {

      //confirm that token provided in the header is valid and belongs to the user
      const token = typeof data.headers.token === 'string' ? data.headers.token : false;
      routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
        if (tokenIsValid) {

          //create object that will hold piza menu items

          //Get the current time of day by hours. If it isn't noon yet then provide customer with morning pizza menu
          const time = new Date().getHours();
          if (time < 12) {
            _data.read('menu', 'breakfastmenu', function (err, data) {
              if (!err && data) {
                callback(200, data)
              } else {
                callback(500, { 'Error': 'Could not read menu from directory' })
              }
            })
          } else {
            _data.read('menu', 'dinnermenu', function (err, data) {
              if (!err && data) {
                callback(200, data)
              } else {
                callback(500, { 'Error': 'Could not read menu from directory' })
              }
            })
          }
        } else {
          callback(403, { 'Error': 'Token provided is either expired or invalid' })
        }
      });
    } else {
      callback(400, { 'Error': 'User email is required to process your order. Please provide a valid registered email address' })
    }
  } else {
    callback(405)
  }
}


//write a function to handle shop requests and decide which operation to perform
routeHandlers.shop = function (data, callback) {
  //define allowed methods
  const allowedMethods = ['post', 'get', 'put', 'delete'];
  //determine the method selected by the user and send the request to the necessary function
  if (allowedMethods.indexOf(data.method) > -1) {
    routeHandlers._shop[data.method](data, callback)
  } else {
    callback(504);
  }
}

routeHandlers._shop = {};


//Define function that will allow logged in customers to create new orders
//Customers will be required to provide email address and token for verification of their order
//They will also have to provide details of their order, depending on the available pizzas
routeHandlers._shop.post = function (data, callback) {
  const email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 && data.queryString.email.includes('@') && data.queryString.email.includes('.') ? data.queryString.email.trim() : false;
  const butternut = typeof data.payload.butternutSquashPizza === 'number' ? data.payload.butternutSquashPizza : 0;
  const chicken = typeof data.payload.chickenPizza === 'number' ? data.payload.chickenPizza : 0;
  const sweet = typeof data.payload.sweetRicottaPizza === 'number' ? data.payload.sweetRicottaPizza : 0;
  const grilled = typeof data.payload.grilledZucchiniPizza === 'number' ? data.payload.grilledZucchiniPizza : 0;
  const macaroni = typeof data.payload.macaroniPizza === 'number' ? data.payload.macaroniPizza : 0;
  const cheese = typeof data.payload.cheesePizza === 'number' ? data.payload.cheesePizza : 0;

  //check to ensure user has provided a valid email address
  if (email) {

    //confirm that token provided in the header is valid and belongs to the user
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        const time = new Date().getHours();
        if (time < 12) {

          //check to ensure order does not contain unavailable items
          if (butternut || chicken || sweet && !grilled && !macaroni && !cheese) {

            //create a unique id to identify shopping cart and allow user perform operations on ordered items
            const orderId = aux.createToken(10);
            //calculate total cost of order items
            const totalCost = (chicken * 6) + (butternut * 5) + (sweet * 7)

            //create object to hold new order
            const order = {
              'Butternut Pizza': '$' + (butternut * 5),
              'Chicken Pizza': '$' + (chicken * 6),
              'Sweet Pizza': '$' + (sweet * 7),
              'TotalCost': '$' + totalCost,
              'OrderId': orderId
            }
            //write order to folder and callback success or otherwise of the function
            _data.create('shoppingCart', orderId, order, function (err) {
              if (!err) {
                callback(200, order)
              } else {
                callback(500, { 'Error': 'Could not create new order' })
              }
            })
          } else {
            callback(403, { 'Error': 'Shopping cart contains pizza orders that are not currently available. Please refer to menu to see available orders' })
          }
        } else {
          if (grilled || macaroni || cheese && !butternut && !chicken && !sweet) {
            //create a unique id to identify shopping cart and allow user perform operations on ordered items
            const orderId = aux.createToken(10);
            //calculate total cost of order items
            const totalCost = (cheese * 6) + (macaroni * 5) + (grilled * 8)

            //create object to hold new order
            const order = {
              'Grilled Pizza': '$' + (grilled * 8),
              'Macaroni Pizza': '$' + (macaroni * 5),
              'Cheese Pizza': '$' + (cheese * 6),
              'TotalCost': '$' + totalCost,
              'OrderId': orderId
            }
            //write order to folder and callback success or otherwise of the function
            _data.create('shoppingCart', orderId, order, function (err) {
              if (!err) {
                callback(200, order)
              } else {
                callback(500, { 'Error': 'Could not create new order' })
              }
            })
          } else {
            callback(403, { 'Error': 'Shopping cart contains pizza orders that are currently unavailable. Please refer to menu to see available orders' })
          }
        }
      } else {
        callback(400, { 'Error': 'Token is either invalid or expired. Please provide valid token to continue' })
      }
    })
  } else {
    callback(400, { 'Error': 'Please provide required email address' })
  }
}



//define function for getting user's shopping cart and the items ordered
//the function will accept the user's email, shopping cart id and token
routeHandlers._shop.get = function (data, callback) {
  const email = typeof data.headers.email === 'string' && data.headers.email.trim().length > 0 && data.headers.email.includes('@') && data.headers.email.includes('.') ? data.headers.email.trim() : false;
  const orderId = typeof data.queryString.orderId === 'string' && data.queryString.orderId.trim().length === 10 ? data.queryString.orderId.trim() : false;

  if (email && orderId) {

    const token = typeof data.headers.token === 'string' ? data.headers.token : false;

    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('shoppingCart', orderId, function (err, data) {
          if (!err && data) {
            callback(200, data);
          } else {
            callback(400, { 'Error': 'Could not find specified order item. Please check provided Order Id' })
          }
        });
      } else {
        callback(403, { 'Error': 'Token provided is either invalid or expired or Order Id is invalid' })
      }
    });
  } else {
    callback(400, { 'Error': 'Please provide valid, registered email' })
  }
}


//define function to modify shopping cart items
//function will require user email, order id and a valid token
//Any of the items can be modified so far it is available on the menu
routeHandlers._shop.put = function (data, callback) {
  const email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 && data.queryString.email.includes('@') && data.queryString.email.includes('.') ? data.queryString.email.trim() : false;
  const butternut = typeof data.payload.butternutSquashPizza === 'number' ? data.payload.butternutSquashPizza : 0;
  const chicken = typeof data.payload.chickenPizza === 'number' ? data.payload.chickenPizza : 0;
  const sweet = typeof data.payload.sweetRicottaPizza === 'number' ? data.payload.sweetRicottaPizza : 0;
  const grilled = typeof data.payload.grilledZucchiniPizza === 'number' ? data.payload.grilledZucchiniPizza : 0;
  const macaroni = typeof data.payload.macaroniPizza === 'number' ? data.payload.macaroniPizza : 0;
  const cheese = typeof data.payload.cheesePizza === 'number' ? data.payload.cheesePizza : 0;
  const orderId = typeof data.payload.orderId === 'string' && data.payload.orderId.trim().length === 10 ? data.payload.orderId.trim() : false;

  //check to ensure user has provided a valid email address
  if (email && orderId) {

    //confirm that token provided in the header is valid and belongs to the user
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        //read through shopping carts to find specified cart
        _data.read('shoppingCart', orderId, function (err, data) {
          if (!err && data) {
            //check time of day to determine available orders
            const time = new Date().getHours();
            //if it's still morning, then check to ensure morning menu items are ordered
            if (time < 12) {
              if (butternut || chicken || sweet) {
                if (butternut) {
                  data["Butternut Pizza"] = '$' + butternut * 5;
                }
                if (chicken) {
                  data["Chicken Pizza"] = '$' + chicken * 6;
                }
                if (sweet) {
                  data["Sweet Pizza"] = '$' + sweet * 7;
                }

                //calculate cost of orders made
                const total = (butternut * 5) + (chicken * 6) + (sweet * 7);

                //if order contains items from another menu then delete those items
                delete data.TotalCost;
                delete data["Grilled Pizza"];
                delete data["Macaroni Pizza"];
                delete data["Cheese Pizza"];

                //update shopping cart with new items
                data.TotalCost = '$' + total;
                _data.update('shoppingCart', orderId, data, function (err) {
                  if (!err) {
                    callback(200, data);
                  } else {
                    callback(500, { 'Error': 'Could not update shopping cart with specified items' })
                  }
                });
              }
            } else {
              //it's it noon, then check to ensure customer orders pizzas available in dinner menu
              if (grilled || macaroni || cheese) {
                if (grilled) {
                  data["Grilled Pizza"] = '$' + grilled * 8;
                }
                if (macaroni) {
                  data["Macaroni Pizza"] = '$' + macaroni * 5;
                }
                if (cheese) {
                  data["Cheese Pizza"] = '$' + cheese * 6;
                }
                //find total cost or order made
                const total = (grilled * 8) + (macaroni * 5) + (cheese * 6);

                //delete items from another order that aren't currently available on the menu
                delete data.TotalCost;
                delete data["Sweet Pizza"];
                delete data["Chicken Pizza"];
                delete data["Butternut Pizza"];

                //update shopping cart with current items
                data.TotalCost = '$' + total;
                _data.update('shoppingCart', orderId, data, function (err) {
                  if (!err) {
                    callback(200, data)
                  } else {
                    callback(500, { 'Error': 'Could not update shopping cart with specified items' })
                  }
                })
              }
            }
          } else {
            callback(400, { 'Error': 'Order Id provided does not match any shopping Cart' })
          }
        });
      } else {
        callback(403, { 'Error': 'Provided token is either invalid or expired' })
      }
    });
  } else {
    callback(400, { 'Error': 'Please provide valid, registered email address and your order Id' })
  }
}


//define function that will allow deleting items from shopping cart
//function will take the user's email, login token and order ID
routeHandlers._shop.delete = function (data, callback) {
  const email = typeof data.headers.email === 'string' && data.headers.email.trim().length > 0 && data.headers.email.includes('@') && data.headers.email.includes('.') ? data.headers.email.trim() : false;
  const orderId = typeof data.queryString.orderId === 'string' && data.queryString.orderId.trim().length === 10 ? data.queryString.orderId.trim() : false;

  if (email && orderId) {

    //confirm that token provided is valid and belongs to the user
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {

        //if token is valid then delete the shopping cart, else flag an error
        _data.delete('shoppingCart', orderId, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete shopping cart' })
          }
        })
      } else {
        callback(400, { 'Error': 'Provided token is not valid' })
      }
    });
  } else {
    callback(400, { 'Error': 'Please provide valid email address and order Id' })
  }
}


//routeHandlers.checkout = {};

//define a function that will allow users pay for pizza ordered. Only post method is allowed
//The function will take in the user's token, orderId, order cost and card details
routeHandlers.checkout = function (data, cb) {
  //check to ensure post method is selected
  if (data.method === 'post') {
    const email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
    const orderId = typeof data.payload.orderId === 'string' && data.payload.orderId.trim().length === 10 ? data.payload.orderId.trim() : false;
    const cardNumber = typeof data.payload.cardNumber === 'string' && data.payload.cardNumber.trim().length > 10 && data.payload.cardNumber.trim().length < 17 ? data.payload.cardNumber.trim() : false;
    const cardExpiryYear = typeof data.payload.cardExpiryYear === 'string' && data.payload.cardExpiryYear.trim().length === 4 ? data.payload.cardExpiryYear.trim() : false;
    const cardExpiryMonth = typeof data.payload.cardExpiryMonth === 'string' && data.payload.cardExpiryMonth.trim().length === 2 ? data.payload.cardExpiryMonth.trim() : false;
    const cardCvv = typeof data.payload.cardCvv === 'string' && data.payload.cardCvv.trim().length === 3 ? data.payload.cardCvv.trim() : false;
    const charge = typeof data.payload.orderCost === 'number' ? data.payload.orderCost : false;

    if (email && orderId && cardNumber && cardExpiryYear && cardExpiryMonth && cardCvv && charge) {

      //check to ensure card has not expired
      const year = new Date().getFullYear();
      const month = new Date().getMonth();
      if (year < Number(cardExpiryYear) || (year === Number(cardExpiryYear) && month < Number(cardExpiryMonth))) {

        //confirm that token provided is valid and belongs to the user
        const token = typeof data.headers.token === 'string' ? data.headers.token : false;
        routeHandlers._token.verifyToken(token, email, function (tokenIsValid) {
          if (tokenIsValid) {
            //check the shopping cart to ensure amount entered by customer matches amount on cart
            _data.read('shoppingCart', orderId, function (err, data) {
              if (!err && data) {
                //check to ensure both amounts are same
                if (data["TotalCost"] == '$' + charge) {
                  //call function to charge card with stripe api
                  aux.makeStripeCharge(email, charge, err => {
                    if (!err) {
                      console.log('Your credit card with number ' + cardNumber + ' has been charged $' + charge + ' for your pizza order. Thank you for your patronage!');

                      //call function to send receipt to customer's email address
                      aux.sendEmail(email, charge, orderId, err => {
                        if (!err) {
                          console.log("Email with order receipt successfully sent to " + email + " !")
                          cb(200)
                        } else {
                          console.log('Could not send email with receipt to customer')
                          cb(500, { 'Error': 'Could not send email with receipt to customer' })
                        }
                      })
                    } else {
                      cb(500, { 'Error': 'Could not process charge' })
                    }
                  });
                } else {
                  cb(400, { 'Error': 'Amount on shopping cart does not match amount entered by customer' })
                }
              } else {
                cb(400, { 'Error': 'Could not read the user\'s shopping cart' })
              }
            })

          } else {
            cb(403, { 'Error': 'Please provide valid token' })
          }
        })
      } else {
        cb(400, { 'Error': 'Credit card has expired. Please provide valid card for payment' })
      }
    } else {
      cb(400, { 'Error': 'Required fields not provided' })
    }
  } else {
    cb(405, { 'Error': 'Selected method is not allowed' })
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