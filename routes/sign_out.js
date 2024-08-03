const express = require("express");
const router = express.Router();

router.route("/").get((req, res) => {
  console.log("GET /sign-out");
  res.setHeader("Content-Type", "application/json");
  const answer = {};
  //Verificamos si esta creada la sesion
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        answer.response = "Sign out error";
        res.status(500);
        res.send(JSON.stringify);
      } else {
        answer.response = "Sign out successful";
        res.status(200);
        res.send(JSON.stringify(answer));
      }
    });
  } else {
    answer.response = "You haven't sign in yet";
    res.status(403);
    res.send(JSON.stringify(answer));
  }
});
module.exports = router;
