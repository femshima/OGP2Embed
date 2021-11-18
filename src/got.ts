import got, { CancelableRequest, GotStream, Progress, RequestEvents, Response } from "got";

import logger from "./log";

function isCancelableRequest(arg: any): arg is CancelableRequest {
  return typeof arg.cancel === "function";
}

const defaultContext = {
  downloadLimit: 1048576,
  uploadLimit: 1048576,
}


//https://github.com/sindresorhus/got/blob/5cbcf526b6e7be5e40f1ad137172d7b2b68988da/documentation/examples/advanced-creation.js
const limitDownloadUpload = got.extend({
  handlers: [
    (options, next) => {
      let downloadLimit = options.context.downloadLimit as number ?? defaultContext.downloadLimit;
      let uploadLimit = options.context.uploadLimit as number ?? defaultContext.uploadLimit;

      let promiseOrStream = next(options);


      // A destroy function that supports both promises and streams
      const destroy = (message: string) => {
        if (isCancelableRequest(promiseOrStream)) {
          logger.warning(`${message} url->${options.url}`);
          promiseOrStream.cancel(message);
        } else if (options.isStream) {
          promiseOrStream.destroy(new Error(message));
        }
      };

      const downloadProgress = (progress: Progress) => {
        if (progress.transferred > downloadLimit && progress.percent !== 1) {
          destroy(`Exceeded the download limit of ${downloadLimit} bytes`);
        }
      };
      const uploadProgress = (progress: Progress) => {
        if (progress.transferred > uploadLimit && progress.percent !== 1) {
          destroy(`Exceeded the upload limit of ${uploadLimit} bytes`);
        }
      }

      if (typeof downloadLimit === 'number') {
        if (isCancelableRequest(promiseOrStream)) {
          promiseOrStream.on('downloadProgress', downloadProgress);
        }
        else {
          promiseOrStream.on('downloadProgress', downloadProgress);
        }
      }

      if (typeof uploadLimit === 'number') {
        if (isCancelableRequest(promiseOrStream)) {
          promiseOrStream.on('uploadProgress', uploadProgress);
        }
        else {
          promiseOrStream.on('uploadProgress', uploadProgress);
        }
      }

      return promiseOrStream;
    }
  ]
});

const cache = new Map();

const customGot = got.extend({
  cache,
  headers: {
    'user-agent': process.env.UserAgent
  },
  handlers: [
    (options, next) => {
      logger.log("access", `${options.method} ${options.url}`);
      return next(options);
    }
  ],
  mutableDefaults: true
});

export default got.extend(
  customGot,
  limitDownloadUpload,
);