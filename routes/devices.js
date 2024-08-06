const express = require("express");
const router = express.Router();
const websocketManager = require("./web_socket_manager");
const { getDevices } = websocketManager;
router.route("/")
.get((req, res) => {
  console.log("GET /devices");
  res.setHeader("Content-Type", "application/json");
  const answer = {
    response:"",
    devices:[]
  };
  //Verificamos si esta creada la sesion, si lo esta tiene acceso a esta informacion, si no no
  if (req.session.user) {
    const devices = req.session.user.devices;
    const data = [];
    //vemos cual es el id
    devices.forEach((device) => {
      console.log(device);
      const id = device.id;
      data.push(getDevices((metadata) => (metadata.device_id == id)));
    });
    answer.response = "Connected account devices";
    data.forEach(el => {
      if(el!=null){
        el.forEach(device => {
          answer.devices.push(device);
        });
      }
    });
    console.log(answer);
    res.status(200);
    res.send(JSON.stringify(answer));
  } else {
    answer.response = "Unauthorized information";
    res.status(401);
    res.send(JSON.stringify(answer));
  }
});

module.exports = router;
