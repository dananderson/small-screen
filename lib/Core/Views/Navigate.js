/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Navigation event (or context) that facilitates communication between the focus manager and the focus delegates.
 */
export class Navigate {
  static DONE = 1
  static CONTINUE = 3
  static ABORT = 4

  static SYNC_CHILD = -1

  constructor (direction) {
    this.direction = direction
    this.pending = null
    this.command = null
    this.next = null
  }

  /**
   * Indicates that the focus delegate has found a focus candidate, but the focus manager should continue searching
   * in the current direction for a better match. A typical use case for continue is when the current focus of a
   * focus delegate is the last item in the current direction. The focus manager has to determine if this is the
   * end or if there is another focusable or focus delegate in the current direction.
   *
   * @param view Focus candidate.
   */
  continue (view) {
    this.command = Navigate.CONTINUE
    this.pending = this.pending || view
  }

  /**
   * Indicates that the focus delegate has ignored the navigation request and the focus manager should continue
   * traversal. A typical use case is a focus delegate that handles up & down direction, but receives a right
   * direction.
   */
  pass () {
    this.command = Navigate.CONTINUE
  }

  /**
   * Indicates that the focus delegate has definitively found the next focus view and the focus manager should stop
   * searching. A typical use case is a focus delegate that handles a horizontal list. The current focus is in the
   * middle of the list and the navigate direction is right. In the case, it is clear that the next focus is within
   * the list owned by the focus delegate.
   *
   * @param view Next view to focus.
   */
  done (view) {
    this.command = Navigate.DONE
    this.next = view
  }

  /**
   * Indicates that the focus delegate has determined that the current navigation request should stop immediately. A
   * typical use case for abort is when a focus delegate is busy animating and cannot move focus.
   */
  abort () {
    this.command = Navigate.ABORT
  }
}
