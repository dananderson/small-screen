/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { AudioResource } from '../../Core/Resource/AudioResource'
import { application } from '..'

/**
 * Starts playback of an audio sample.
 *
 * Audio samples must first be loaded through Resource.addSample(). If the audio sample failed to load or is not
 * ready, playback will not start.
 *
 * @param id The audio sample ID is the src.uri or src.alias used when loading the audio sample.
 */
export function play (id) {
  const resource = application.resource.acquireResource(id)

  if (resource instanceof AudioResource && resource.isAttached) {
    application.audio.play(resource.sample)
  }
}
