import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("clocktAPI", {
  version: "1.0.0",
});