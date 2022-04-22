const Joi = require('joi'); //Form validations...
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const verifyJWT = require('../middleware/auth');

/*
* View all users
*/
router.get('/', verifyJWT, (req, res) => {
    res.status(200).send({ result: userData, validation: {status:true, message:'Successfully Loaded!'} });
});

/*
* View all doctors
*/
router.get('/doctors', verifyJWT, (req, res) => {

    //filter by date...
    let doctors = userData.filter(u => {
        return (u.userType === 'Doctor');
    });

    res.status(200).send({ result: doctors, validation: {status:true, message:'Successfully Loaded!'} });
});


/*
* User Registration
*/
router.post('/', (req, res) => {

    // Validation...
    const {error} = validateUser(req.body);
    if(error){
        return res.status(200).send({validation:{status:false, status_code:200, message:error.details[0].message}})
    }

    // Check email exist...
    const user = checkUserEmailExist(req.body.email);
    if(user){
        res.status(200).send({validation: {status:false, status_code:200, message:'Email Address has already been used!'} });
        return;
    }

    //Insert new user...
    const newUser = {
        id: userData.length + 1,
        userType: req.body.userType,
        name: req.body.name,
        email: req.body.email,
        password: hashPassword(req.body.password),
    };

    userData.push(newUser);

    //send request
    res.status(201).send({ result: newUser, validation: {status:true, status_code:201, message:'Successfully Registered!'} });
});

/*
* Check if user is Authentication using JWT
*/
router.get('/auth', verifyJWT, (req, res) => {

    //Check if exist...
    const user = checkUserExist(req.userID);
    if(!user){
        res.status(200).send({validation:{status:false, status_code:401, message:'User not found!'}});
        return;
    }

    // Prepare response...
    const userResult = {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        token: req.token,
        auth: true
    }

    res.status(200).send({ result: userResult, validation: {status:true, message:'Authenticated!'} });
});


/*
* User Login
*/
router.post('/login', (req, res) => {

    // Validation...
    const {error} = validateLoginUser(req.body);
    if(error){
        return res.status(200).send({validation:{status:false, status_code:200, message:error.details[0].message}})
    }

    // Check email exist...
    const user = checkUserEmailExist(req.body.email);
    if(!user){
        res.status(200).send({validation:{status:false, status_code:200, message:'Email not found!'} });
        return;
    }

    //check email and password match
    const attempt = userData.find(u => {
        return u.email === String(req.body.email) && String(u.password) === String(hashPassword(req.body.password))
    });

    if(attempt){
        //Logged in...

        const id = attempt.id;
        const jwtToken = jwt.sign({id}, "jwtsecret", { //To note secret can be save on the ENV
            expiresIn: '60d' // expires in 365 days
            //expiresIn: 1,
        })

        attempt['token'] = jwtToken; //add token...

        loginData = {
            result: {
                id: attempt.id,
                name: attempt.name,
                userType: attempt.userType,
                email: attempt.email,
                token: jwtToken,
                auth: true
            },
            validation:{
                status:true,
                status_code:200,
                message:'Successfully Login!'
            }
        }

        //send request
        res.status(200).send(loginData);
    }else{
        //Not logged in
        loginData = {
            result: [],
            validation:{
                status:false,
                status_code:200,
                message:'Invalid email and password!'
            }
        }
        //send request
        res.status(200).send(loginData);
    }

});

/*
* Function validator
*/
function validateUser(user){
    const rules = {
        'userType': Joi.string().required().label('User Type'),
        'name': Joi.string().min(3).required().label('Name'),
        'email': Joi.string().min(3).required().email().label('Email Address'),
        'password': Joi.string().min(6).required().label('Password'),
        'confirmPassword': Joi.string().valid(Joi.ref('password')).required().label('Confirmation Password'),
    };
    return Joi.validate(user, rules);
}

function validateLoginUser(user){
    const rules = {
        'email': Joi.string().min(3).required().email().label('Email Address'),
        'password': Joi.string().min(6).required().label('Password'),
    };
    return Joi.validate(user, rules);
}


/*
* Function check item if exist
*/
function checkUserExist(param_id){
    const user = userData.find(u => u.id === parseInt(param_id));
    return user;
}

/*
* Function check item  email if exist
*/
function checkUserEmailExist(param_email){
    const user = userData.find(u => u.email === String(param_email));
    return user;
}

/*
* Simple hashPassword
*/
function hashPassword(password){
    const md5sum = crypto.createHash('md5');
    return md5sum.update(password).digest('hex');
}

module.exports = router;
