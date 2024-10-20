var jwt = require("jsonwebtoken")
const JWT_SECRET = "equalport_secert_code"

const fetchUser = (req,res,next)=>{ 
    const token = req.header('Authorization') 

    if(!token){
        res.status(401).json({error:"Token not provided"})
    }
    const actualToken = token.split(' ')[1];
    //now, token verification 
    try {
        const data = jwt.verify(actualToken,JWT_SECRET);
        req.user = data.user
        console.log('Decoded user ID in fetch:', req.user);
        //if everything is fine, call next() to pass control to the next middleware or route handler
        next();
    } catch (error) {
        res.status(401).send({error:"Token invalid"})
    }
    
};
module.exports = fetchUser;``