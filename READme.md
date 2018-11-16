This repo is code for assignment number two on the Node.JS Master Class. It is an API for a pizza delivery company that allows creating of new users with a valid email address and other crud operations on the users. It allows users to create, get, extend and delete tokens for logging in. S logged in user can get the pizza menu available, create, see, edit and delete pizza orders and also pay for a pizza delivery with his card. When a user pays, the card provided is charged using the Stripe payment API and the user is sent an email with the payment details using the Mailgun mail API.

The Assignment (Scenario):

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager: 

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account

USING THE API:
1. To place an order:
a. Create a user
b. Create a login token. Note that the token expires after 30 minutes
c. Get the menu
d. Create an order
e. Checkout the order to make payment


2. USERS (POST, GET, PUT, DELETE):
a. To create a new user, you'll need to navigate to curl POST/users. The following information is required:
i. Full name
ii. Unique email address. No two users can have the same email address
iii. Street address
iv. Password

b. To see the user created, navigate to curl curl GET/users/email.
This request requires you provide your email as query and a valid token in the headers.

c. To update a user's information, navigate to curl PUT/users. The following information is required:
i. Email address.
One of the other fields must be provided in order to update user information.
This request also requires the provision of a valid token. The request will fail otherwise.

d. To delete a user, navigate to curl DELETE/users.
The user's email and a valid token is required for this request.


3. TOKENS (POST, GET, PUT, DELETE)
The token is required to verify that a user is logged in. Tokens expire after 30 minutes after they've been created if they aren't extended.

a. To create a new token, curl POST/tokens.
The user's email address and password are both required for this request. If successful, the user is assigned a new random token that is valid for 30 minutes.

b. A token's expiry can be displayed to the user via curl GET/tokens. The user's valid token is necessary for this request.

c. A token's expiry can be extended by an extra thirty minutes using curl PUT/tokens. This requests requires the user's token and a boolean-extends, set to true.

d. A token can be deleted with curl DELETE/tokens. This request requires the token the user wants to delete.


4. MENU (GET)
The menu route only allows the get method. This method gives the user the menu items available at the time the request is made. User should curl GET/menu.
This request requires the user's email and valid token. The email is provided as a querystring and the token provided in the headers. The request will return an object with the pizza menu items available.


5. SHOP (POST, GET, PUT, DELETE)
Logged in users use this route to add available pizzas to their shopping cart.
a. To create a shopping order, curl POST/shop. This request requires that the user provide a valid email, token, items to be added to the cart. The token is provided in the headers while everything else is provided in the body of the request. When a user places an order, an order ID is automatically created. This will help the user keep track of the order in order to be able to view, change or delete it. If a user adds an unavailable item to his request, it will not be added to his cart. It will return the user's order items, order ID and total charge

b. To view a shopping cart, curl GET/shop. The user will be required to provide a valid email and token in the headers and the orderId in the querystring.

c. To edit an order, users would have to curl GET/shop. The user will be required to provide a valid email, Order ID, token and menu items to be updated. User must provide at least one available menu item to update. Any unavailable item added to the request will not be updated.

d. To delete an order, curl DELETE/shop. The user's email, order ID and valid token is required.


6. CHECKOUT (POST)
Only the post method is allowed for this request. The user should curl POST/checkout for this request.
This request requires the user's email, Order ID, token(headers), card number (a string of numbers between 11 and 16 digits), card expiry year (string of 4 digits representing the year), card expiry month (string of two digits representing the card expiry month), CVV code (a string of three numbers) and the cost of the order.
The user's card will be checked against the current year and date for expiry. The order cost provided will be checked to ensure it tallies with the amount on the shopping cart stored in the database.
If the user provides valid information, the card provided is charged with Stripe and an email sent confirming the payment to the registered email using Mailgun.