const express = require('express') 
const router = express.Router()
const User = require("../models/User")
const bcrypt = require("bcryptjs")
var jwt = require("jsonwebtoken")
const { body,validationResult } = require('express-validator');
const JWT_SECRET = "equalport_secert_code"

// ROUTE 1:CREATE a user using:post "/auth/createuser". No login required
router.post('/createuser',[
    body('name','Enter a valid name').isLength({min:3}),
    body('password','Enter a valid email').isLength({min:6}),
    body('email','Enter a valid email').isEmail(),
    body('userName').isLength({min:4}),
], async (req,res)=>{

    //if there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    //here we give specific res error for specific error
    //check wheter the user with this email and usrname already exists 
    //try catch will give the error if error in this block
    try{
        let userEmail= await User.findOne({email:req.body.email});
        let userName= await User.findOne({userName:req.body.userName});
        if(userEmail){
            return res.status(400).json({error:"sorry a user with this email already exists"})
        }
        if(userName){
            return res.status(400).json({error:"Username already exists"})
        }
        const profilePicture = req.body.profilePicture;
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password,salt);
        
        //create a new user
        user = await User.create({
            name:req.body.name,
            password:secPass,
            email:req.body.email,
            userName:req.body.userName,
            gender:req.body.gender,
            profilePicture:profilePicture,
        }) 
        //tokenizing
        const token = jwt.sign({user:{id:user.id}},JWT_SECRET)
        res.json({token, user :{
            id:user.id,
        }})

    }catch(error){
        console.error(error.message)
        res.status(500).send("some error occured ")
    }
});

//ROUTE 2:Authenticate a user using:post "/auth/login". No login required
router.post('/login',[
    body('password','password cant be blank').exists(),
    body('email','Enter a valid email').isEmail(),
], async (req,res)=>{
    //RESPONSE FOR VALIDATION OF THE LOGIN FROM
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    //CHECKING FOR LOGIN AUTHENTICATION 
    const {email,password} = req.body;
    try {
        let user = await User.findOne({email})
        if(!user){
            return res.status(404).json({error:"Please try to login with correct creditentials"})
        }

        const passComp = await bcrypt.compare(password,user.password)
        if(!passComp){
            return res.status(401).json({error:"Please try to login with correct creditentials"})
        }
        //Giving a token the user 
        const payload = { user: { id: user.id } }; // Store user.id in the token
        const token = jwt.sign(payload,JWT_SECRET,{ expiresIn: '2d' })
        res.json({token,user: {
            id: user.id,
            // include other user fields you might need
        }});
    } catch (error) {
        console.error(error.message)
        res.status(500).send("internal server error occured")
    }
});

module.exports = router 