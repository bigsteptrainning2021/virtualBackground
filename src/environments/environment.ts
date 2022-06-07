// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  agoraConfig: {
    appId: "2b8ed03b7c344b54947f709bb0dafa52",
    customerId: "28fc941f93374ae2832915605ae8c570",
    customerCertificate: "22417f6beb04402993545a798a2307f9"

  },
  credential: {
    // Pass your app ID here.
    // appId: "c3675d7c53254d9d885d697b44dcdb1d",
    // appId: "c4700bd6da9b4a1198a9e0cb25a5a393",
    // appId: "126031968fde4d0082559f85e08d26fa",
    appId: "2b8ed03b7c344b54947f709bb0dafa52",
    // Set the channel name.
    channel: "1234",
    // Pass a token if your project enables the App Certificate.
    token: null,
    // Set the user role in the channel.
    role: "host"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.