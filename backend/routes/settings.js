const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const fetchUser = require("../middleware/fetchUser");
const User = require("../models/User");

const router = express.Router();
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

const sanitizeUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  userName: user.userName,
  email: user.email,
  phoneNumber: user.phoneNumber || "",
  gender: user.gender || "",
  profilePicture: user.profilePicture || "",
  settings: {
    privacy: {
      privateProfile: Boolean(user.settings?.privacy?.privateProfile),
      showEmail: Boolean(user.settings?.privacy?.showEmail),
      showPhone: Boolean(user.settings?.privacy?.showPhone),
    },
    notifications: {
      inApp: user.settings?.notifications?.inApp !== false,
      email: user.settings?.notifications?.email !== false,
      mentions: user.settings?.notifications?.mentions !== false,
    },
    preferences: {
      compactMode: Boolean(user.settings?.preferences?.compactMode),
      reduceMotion: Boolean(user.settings?.preferences?.reduceMotion),
      contentLanguage: user.settings?.preferences?.contentLanguage || "English",
    },
  },
});

router.get("/settings", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(sanitizeUserResponse(user));
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({ error: "Internal server error fetching settings" });
  }
});

router.patch(
  "/settings/account",
  fetchUser,
  [
    body("name").optional().isLength({ min: 3 }).withMessage("Name must be at least 3 characters"),
    body("email").optional().isEmail().withMessage("Enter a valid email"),
    body("userName").optional().isLength({ min: 4 }).withMessage("Username must be at least 4 characters"),
    body("phoneNumber")
      .optional({ nullable: true })
      .custom((value) => value === "" || isValidPhoneNumber(value))
      .withMessage("Enter a valid phone number with country code"),
    body("gender")
      .optional()
      .isIn(["Male", "Female", "Other", ""])
      .withMessage("Gender must be Male, Female, Other, or empty"),
    body("profilePicture").optional().isString().withMessage("Profile picture must be a URL string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updates = {};
      if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
      if (req.body.userName !== undefined) updates.userName = String(req.body.userName).trim();
      if (req.body.email !== undefined) updates.email = String(req.body.email).toLowerCase().trim();
      if (req.body.gender !== undefined) updates.gender = req.body.gender;
      if (req.body.profilePicture !== undefined) updates.profilePicture = String(req.body.profilePicture).trim();

      const hasPhoneUpdate = req.body.phoneNumber !== undefined;
      if (hasPhoneUpdate) {
        updates.phoneNumber = req.body.phoneNumber
          ? normalizePhoneNumber(req.body.phoneNumber)
          : undefined;
      }

      if (updates.email && updates.email !== user.email) {
        const existingEmail = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      if (updates.userName && updates.userName !== user.userName) {
        const existingUserName = await User.findOne({
          userName: updates.userName,
          _id: { $ne: user._id },
        });
        if (existingUserName) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      if (updates.phoneNumber && updates.phoneNumber !== user.phoneNumber) {
        const existingPhone = await User.findOne({
          phoneNumber: updates.phoneNumber,
          _id: { $ne: user._id },
        });
        if (existingPhone) {
          return res.status(400).json({ error: "Phone number already exists" });
        }
      }

      if (hasPhoneUpdate) {
        user.phoneNumber = updates.phoneNumber;
      }
      Object.assign(user, updates);
      await user.save();

      return res.json({
        message: "Account settings updated",
        user: sanitizeUserResponse(user),
      });
    } catch (error) {
      console.error("Error updating account settings:", error);
      return res.status(500).json({ error: "Internal server error updating account settings" });
    }
  }
);

router.patch(
  "/settings/privacy",
  fetchUser,
  [
    body("privateProfile").isBoolean(),
    body("showEmail").isBoolean(),
    body("showPhone").isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.settings = user.settings || {};
      user.settings.privacy = {
        privateProfile: Boolean(req.body.privateProfile),
        showEmail: Boolean(req.body.showEmail),
        showPhone: Boolean(req.body.showPhone),
      };

      await user.save();
      return res.json({
        message: "Privacy settings updated",
        settings: sanitizeUserResponse(user).settings,
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      return res.status(500).json({ error: "Internal server error updating privacy settings" });
    }
  }
);

router.patch(
  "/settings/notifications",
  fetchUser,
  [body("inApp").isBoolean(), body("email").isBoolean(), body("mentions").isBoolean()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.settings = user.settings || {};
      user.settings.notifications = {
        inApp: Boolean(req.body.inApp),
        email: Boolean(req.body.email),
        mentions: Boolean(req.body.mentions),
      };

      await user.save();
      return res.json({
        message: "Notification settings updated",
        settings: sanitizeUserResponse(user).settings,
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      return res.status(500).json({ error: "Internal server error updating notification settings" });
    }
  }
);

router.patch(
  "/settings/preferences",
  fetchUser,
  [
    body("compactMode").isBoolean(),
    body("reduceMotion").isBoolean(),
    body("contentLanguage")
      .isString()
      .isLength({ min: 2, max: 30 })
      .withMessage("Language must be between 2 and 30 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.settings = user.settings || {};
      user.settings.preferences = {
        compactMode: Boolean(req.body.compactMode),
        reduceMotion: Boolean(req.body.reduceMotion),
        contentLanguage: String(req.body.contentLanguage).trim(),
      };

      await user.save();
      return res.json({
        message: "Preferences updated",
        settings: sanitizeUserResponse(user).settings,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      return res.status(500).json({ error: "Internal server error updating preferences" });
    }
  }
);

router.patch(
  "/settings/password",
  fetchUser,
  [
    body("currentPassword").isLength({ min: 6 }),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validCurrentPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ error: "New password must be different from current password" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json({ error: "Internal server error updating password" });
    }
  }
);

module.exports = router;
