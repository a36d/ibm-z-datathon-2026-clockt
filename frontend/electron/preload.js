/* global require */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("clocktAPI", {
  version: "1.0.0",
});