const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
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

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const otpData = {};

router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    body("email", "Enter a valid email").isEmail(),
    body("userName").isLength({ min: 4 }),
    body("phoneNumber", "Enter a valid phone number with country code")
      .optional({ checkFalsy: true })
      .isString()
      .custom((value) => isValidPhoneNumber(value)),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const normalizedEmail = String(req.body.email).toLowerCase().trim();
      const normalizedPhone = req.body.phoneNumber ? normalizePhoneNumber(req.body.phoneNumber) : "";

      const userEmail = await User.findOne({ email: normalizedEmail });
      const userName = await User.findOne({ userName: req.body.userName });
      const userPhone = normalizedPhone ? await User.findOne({ phoneNumber: normalizedPhone }) : null;

      if (userEmail) {
        return res.status(400).json({ error: "Sorry, a user with this email already exists" });
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

      const user = await User.create({
        name: req.body.name,
        password: secPass,
        email: normalizedEmail,
        phoneNumber: normalizedPhone || undefined,
        userName: req.body.userName,
        gender: req.body.gender,
        profilePicture,
      });

      const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "2d" });
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
      const user = await User.findOne({ email: String(email).toLowerCase().trim() });
      if (!user) {
        return res.status(404).json({ error: "Please try to login with correct creditentials" });
      }

      let passComp = false;
      const storedPassword = user.password;

      if (typeof storedPassword !== "string" || storedPassword.length === 0) {
        return res.status(401).json({ error: "Please try to login with correct creditentials" });
      }

      try {
        passComp = await bcrypt.compare(password, storedPassword);
      } catch (compareError) {
        // Backward compatibility: if older records accidentally stored plaintext,
        // allow one login and transparently migrate to a hashed password.
        passComp = password === storedPassword;
        if (passComp) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();
        }
      }

      if (!passComp) {
        return res.status(401).json({ error: "Please try to login with correct creditentials" });
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

router.post("/sendOtp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  otpData[email] = generateOTP();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Equal portal Auth" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Use this OTP to complete your account creation: ${otpData[email]}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});

router.post("/verifyOtp", async (req, res) => {
  const { email, otp } = req.body;

  if (otpData[email] && otpData[email] === otp) {
    delete otpData[email];
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: "Invalid OTP" });
  }
});

module.exports = router;
