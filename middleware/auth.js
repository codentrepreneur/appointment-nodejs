/*
* Verify user authentication
*/

const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const token = req.headers["x-access-token"];
    //console.log(token);
    if(!token){
        res.status(302).send({ result: [], validation: {status:false, status_code:302 , message:'Not Authorized!'} }); //Expires
    }else{
        jwt.verify(token, "jwtsecret", (err, decoded) => { //To note secret can be save on the ENV
            if(err){
                res.status(401).send({ result: [], validation: {status:false, status_code:401, message:'Failed Authentication!'} });
            }else{
                req.userID = decoded.id;
                req.token = token;
                next();
            }
        });
    }
};

module.exports = verifyJWT;
