# virtualmarket-backend
V. 0.0.0


## Software Requirements
* node version 14 and above
* Cloudinary Cloud Storage Account
* Stripe Payment Gateway Account
* Working Gmail Account
* Local or Cloud MongoDB Database


## Launch Server
**cli: nodemon**  
_For First Time Launch run "npm i" beforehand & fill in the .env file_


## Deployment
Deployed Server can be accesed on
[Heroku](https://virtual-market-backend.herokuapp.com/)

**Postman_Collection is also included**

## .env file help
PORT = Any Port you want to assign to your http server  
JWT_SECRET_KEY = Any Secret Key for JWT  
cloudinary_cloud_name= Cloudinary Developer Account will Provide this  
cloudinary_api_key= Cloudinary Developer Account will Provide this  
cloudinary_api_secret= Cloudinary Developer Account will Provide this  
email_address = Any GMAIL Address  
email_password = Your GMAIL Password  
salt = Encryption Salt for Passwords  
STRIPE_KEY = Stripe Account will Provide this  
MONGO_VMDB2 = MongoDB Database URI (Local OR Cloud)  
 
