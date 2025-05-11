// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { SystemMode } from "src/app/enums/system.enum";
import { ThemeSettings } from "src/app/model/system.model";
export const environment = {
  production: false,
  apiUrl: 'https://localhost:44376/',
  companyName: "X-mart",
  firebaseDB: 'pos-db',
  currency: 'Rs.',
  orderId: '100',
  systemMode: SystemMode.Online,
  defaultThemeSettings: {
    primaryColor: '#001e3d',
    secondaryColor: '#1b456e',
    backgroundColor: '#f2f7fc',
    fontStyle: 'system-ui',
  } as ThemeSettings,
  firebase: {
    apiKey: "AIzaSyATT2LmEHzzXvgi8XEVmQA9abCQcCD5-70",
    authDomain: "hello-world-e4a65.firebaseapp.com",
    databaseURL: "https://hello-world-e4a65-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hello-world-e4a65",
    storageBucket: "hello-world-e4a65.appspot.com",
    messagingSenderId: "358144022050",
    appId: "1:358144022050:web:9fe01bebc67c2cf691dc7b"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
