/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Interface (documentation) for a Focus Delegate.
 *
 * Note: Focus delegate users can extend this class or just add theses method signatures to an Object.
 *
 * A focus delegate manages focus navigation (or focus transfer) of it's children. A focus delegate expects at least one
 * of it's child view to be marked focusable or contain a focus delegate. The focus delegate can change focus to a new
 * child based on a navigation event. If a focus delegate cannot handle a navigation event, the event is dispatched to
 * an ancestor with a focus delegate (via FocusManager).
 *
 * Example:
 *
 * <box id="topFocusDelegate" focusDelegate={LeftRightFocusDelegate}>
 *     <box id="menuFocusDelegate" focusDelegate={UpDownFocusDelegate}>
 *         <box id="buttonA" focusable><text>A</text></box>
 *         <box id="buttonB focusable><text>B</text></box>
 *     </box>
 *     <box>
 *         <div id="image" focusable><img src={}/></div>
 *     </box>
 * </box>
 *
 * This example UI has two buttons on the left (buttonA, buttonB) and a focusable image on the right (image). The two
 * buttons are laid out vertically. Focus delegates have been added to manage navigation.
 *
 * If buttonA has focus, the user can press down to move the focus to button B. The FocusManager will handle
 * navigation event propagation in the following way. First, since buttonA has focus, it will be considered. Since it
 * does not have a focus delegate, the manager goes to it's parent. The parent, menuFocusDelegate, handles the down key and
 * transfers focus to button B.
 *
 * If buttonA has focus, the user can press right to move the focus to image. The navigation event will start at
 * buttonA, then move up to menuFocusDelegate. menuFocusDelegate does not process the right key, so the event will go to
 * the parent, topFocusDelegate. topFocusDelegate handles the right key and transfers focus to the image.
 */
export class FocusDelegate {
  focusDelegateNavigate (owner, navigate) {

  }
  focusDelegateResolve (owner, navigate) {

  }
}
