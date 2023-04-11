var b = {};

if (typeof browser == "undefined") {
//   console.log("Chromium");
  Object.assign(b, chrome);
} else if (typeof chrome == "undefined") {
//   console.log("Firefox");
  Object.assign(b, browser);
}

const BT = {
    DEVICE_NAME: "ThinToken Reader",
    SERVICE_UUID: "5fcf031e-75a8-46a3-96da-3e9a818019b8",
    STATUS_CHARACTERISTIC: "49a2d591-16b6-4401-a328-cb9e93b3c767",
    SECRET_CHARACTERISTIC: "5b8d2706-ad76-4176-b510-307cda6e2470",
    OTP_CHARACTERISTIC: "5ae6d765-0752-428e-aa0c-201abe81f6ea",
    TIME_CHARACTERISTIC: "0ceb7679-13c5-41e6-a4e0-5ab441759a8d",
    ID_CHARACTERISTIC: "e089897a-b96e-4fc6-9020-0f60c1d8434d",
    SECTOR_CHARACTERISTIC: "3fd0c753-4c63-4c1c-ac9a-5ed671468d39"
};

const STATUS = {
    Ready: 0x00,
    WriteFlowRequested: 0xF1,
    WriteFlowReady: 0x01,
    WriteFlowRequestFailed: 0x10,
    WriteFlowEndRequest: 0x11,
    WriteTagReady: 0x21,
    TagRead: 0x02,
    WriteSuccess: 0x03,
    WriteFailed: 0x04,
    ReadQueueEmpty: 0x05,
    ReadAllRequested: 0x06,
    MutexLocked: 0x07,
    OtpRequested: 0x08,
    OtpFailed: 0x18
};