const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const JWT_SECRET = "equalport_secert_code";

const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "+91";

const normalizePhoneNumber = (phoneNumber = "") => {
  const raw = String(phoneNumber).trim();
  if (!raw) return "";

  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return `+${digits}`;
  }

  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    const ccDigits = DEFAULT_COUNTRY_CODE.replace(/[^\d]/g, "");
    return `+${ccDigits}${digitsOnly}`;
  }

  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return raw.replace(/\s+/g, "");
};

const isValidPhoneNumber = (phoneNumber = "") =>
  /^\+[1-9]\d{9,14}$/.test(normalizePhoneNumber(phoneNumber));


// ROUTE 1:CREATE a user using:post "/auth/createuser". No login required
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
    body("email", "Enter a valid email").isEmail(),
    body("userName").isLength({ min: 4 }),
    body("phoneNumber", "Enter a valid phone number with country code")
      .isString()
      .custom((value) => isValidPhoneNumber(value)),
  ],
  async (req, res) => {

    //if there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //here we give specific res error for specific error
    //check wheter the user with this email and usrname already exists 
    //try catch will give the error if error in this block
    try {
      const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber);

      const normalizedEmail = String(req.body.email).toLowerCase().trim();

      let userEmail = await User.findOne({ email: normalizedEmail });
      let userName = await User.findOne({ userName: req.body.userName });
      let userPhone = await User.findOne({ phoneNumber: normalizedPhone });
      if (userEmail) {
        return res
          .status(400)
          .json({ error: "Sorry, a user with this email already exists" });
      }
      if (userName) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (userPhone) {
        return res.status(400).json({ error: "Phone number already exists" });
      }

      const profilePicture = req.body.profilePicture;
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      //create a new user
      const user = await User.create({
        name: req.body.name,
        password: secPass,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        userName: req.body.userName,
        gender: req.body.gender,
        profilePicture: profilePicture,
      });
      //tokenizing
      const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET);
      res.json({
        token,
        user: {
          id: user.id,
        },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error occured ");
    }
  }
);

// ROUTE 2: Direct login (email+password)
router.post(
  "/login",
  [
    body("password", "password cant be blank").exists(),
    body("email", "Enter a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email: String(email).toLowerCase().trim() });
      if (!user) {
        return res
          .status(404)
          .json({ error: "Please try to login with correct creditentials" });
      }

      const passComp = await bcrypt.compare(password, user.password);
      if (!passComp) {
        return res
          .status(401)
          .json({ error: "Please try to login with correct creditentials" });
      }
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2d" });
      res.json({
        token,
        user: {
          id: user.id,
        },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("internal server error occured");
    }
  }
);
module.exports = router;
