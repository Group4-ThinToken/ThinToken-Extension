import React from "react";

function buttonClick() {
  navigator.bluetooth
    .requestDevice({
      filters: [
        {
          services: ["5fcf031e-75a8-46a3-96da-3e9a818019b8"],
        },
      ],
    })
    .then((device) => {
      console.log(device);
      return device.gatt.connect();
    })
    .then((server) => {
      console.log(server);
      return server.getPrimaryService("5fcf031e-75a8-46a3-96da-3e9a818019b8");
    })
    .then((service) => {
      return service.getCharacteristic("49a2d591-16b6-4401-a328-cb9e93b3c767");
    })
    .then((characteristic) => {
      return characteristic.readValue();
    })
    .then((value) => {
      console.log(value);
    });
}

export const Options = () => {
  return <button onClick={buttonClick}></button>;
};
