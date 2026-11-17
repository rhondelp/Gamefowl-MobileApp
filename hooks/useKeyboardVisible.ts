/**
 * File: hooks/useKeyboardVisible.ts
 *
 * Purpose:
 *   Presentation-only signal for screens that compact their layout while the
 *   software keyboard is open (e.g. the Login logo shrinks so the form stays
 *   in view on small phones).
 */
import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // iOS has "will" events (start of the animation); Android only "did".
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
