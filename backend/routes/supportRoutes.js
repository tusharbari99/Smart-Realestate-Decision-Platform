const express = require("express");

const controller = require("../controllers/supportController");

const router = express.Router();

router.post("/messages", controller.createMessage);

module.exports = router;
