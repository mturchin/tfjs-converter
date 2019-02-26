/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {deprecationWarn, io, util} from '@tensorflow/tfjs-core';
import {DEFAULT_MANIFEST_NAME, FrozenModel, loadFrozenModel as loadFrozenModelPB} from './executor/frozen_model';
import {FrozenModel as GraphModel, loadFrozenModel as loadFrozenModelJSON, loadTfHubModule as loadTfHubModuleJSON} from './executor/frozen_model_json';
export {FrozenModel, loadTfHubModule} from './executor/frozen_model';
export {FrozenModel as GraphModel} from './executor/frozen_model_json';
export {version as version_converter} from './version';

/**
 * Deprecated. Use `tf.loadGraphModel`.
 *
 * Load the frozen model through url.
 *
 * Example of loading the MobileNetV2 model and making a prediction with a zero
 * input.
 *
 * ```js
 * const GOOGLE_CLOUD_STORAGE_DIR =
 *     'https://storage.googleapis.com/tfjs-models/savedmodel/';
 * const MODEL_URL = 'mobilenet_v2_1.0_224/tensorflowjs_model.pb';
 * const WEIGHTS_URL =
 *     'mobilenet_v2_1.0_224/weights_manifest.json';
 * const model = await tf.loadFrozenModel(GOOGLE_CLOUD_STORAGE_DIR + MODEL_URL,
 *      GOOGLE_CLOUD_STORAGE_DIR + WEIGHTS_URL);
 * const zeros = tf.zeros([1, 224, 224, 3]);
 * model.predict(zeros).print();
 * ```
 *
 * @param modelUrl url for the model file generated by scripts/convert.py
 *    script.
 * @param weightManifestUrl url for the weight file generated by
 *    scripts/convert.py script.
 * @param requestOption options for Request, which allows to send credentials
 *    and custom headers.
 * @param onProgress Optional, progress callback function, fired periodically
 *    before the load is completed.
 */
/** @doc {heading: 'Models', subheading: 'Loading'} */
export function loadFrozenModel(
    modelUrl: string, weightsManifestUrl?: string, requestOption?: RequestInit,
    onProgress?: Function): Promise<FrozenModel> {
  deprecationWarn(
      'tf.loadFrozenModel() is going away. ' +
      'Use tf.loadGraphModel() instead, and note the positional argument changes.');

  if (modelUrl && modelUrl.endsWith('.json')) {
    return (loadFrozenModelJSON(modelUrl, requestOption, onProgress) as
                // tslint:disable-next-line:no-any
                Promise<any>) as Promise<FrozenModel>;
  }
  // if users are using the new loadGraphModel API, the weightManifestUrl
  // will be omitted. We will build the url using the model URL path and
  // default manifest file name.
  if (modelUrl != null && weightsManifestUrl == null) {
    weightsManifestUrl = getWeightsManifestUrl(modelUrl);
  }
  return loadFrozenModelPB(
      modelUrl, weightsManifestUrl, requestOption, onProgress);
}

function getWeightsManifestUrl(modelUrl: string): string {
  let weightsManifestUrl: string;
  if (modelUrl != null) {
    const path = modelUrl.substr(0, modelUrl.lastIndexOf('/'));
    weightsManifestUrl = path + '/' + DEFAULT_MANIFEST_NAME;
  }
  return weightsManifestUrl;
}

/**
 * Load a graph model given a URL to the model definition.
 *
 * Example of loading MobileNetV2 from a URL and making a prediction with a
 * zeros input:
 *
 * ```js
 * const modelUrl =
 *    'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/tensorflowjs_model.pb';
 * const model = await tf.loadGraphModel(modelUrl);
 * const zeros = tf.zeros([1, 224, 224, 3]);
 * model.predict(zeros).print();
 * ```
 *
 * Example of loading MobileNetV2 from a TF Hub URL and making a prediction with
 * a zeros input:
 *
 * ```js
 * const modelUrl =
 *    'https://tfhub.dev/google/imagenet/mobilenet_v2_140_224/classification/2';
 * const model = await tf.loadGraphModel(modelUrl, {fromTFHub: true});
 * const zeros = tf.zeros([1, 224, 224, 3]);
 * model.predict(zeros).print();
 * ```
 * @param modelUrl The url or an `io.IOHandler` that loads the model.
 * @param options Options for the HTTP request, which allows to send credentials
 *    and custom headers.
 */
/** @doc {heading: 'Models', subheading: 'Loading'} */
export function loadGraphModel(
    modelUrl: string|io.IOHandler,
    options: io.LoadOptions = {}): Promise<GraphModel> {
  if (modelUrl == null) {
    throw new Error(
        'modelUrl in loadGraphModel() cannot be null. Please provide a url ' +
        'or an IOHandler that loads the model');
  }
  if (options == null) {
    options = {};
  }

  if (options.fromTFHub) {
    return loadTfHubModuleJSON(
        modelUrl as string, options.requestInit, options.onProgress);
  }

  // TODO: Remove this logic for version 1.0.
  // For backwards compatibility, handle .pb files.
  if (util.isString(modelUrl) && modelUrl.endsWith('.pb')) {
    const weightsManifestUrl = getWeightsManifestUrl(modelUrl as string);
    return loadFrozenModelPB(
               modelUrl as string, weightsManifestUrl, options.requestInit,
               // tslint:disable-next-line:no-any
               options.onProgress) as any;
  }

  return loadFrozenModelJSON(modelUrl, options.requestInit, options.onProgress);
}
