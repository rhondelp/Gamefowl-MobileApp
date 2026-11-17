/**
 * File: components/ui/Screen.tsx
 *
 * Purpose:
 *   Shared page container. Wraps every screen so padding, background, and
 *   keyboard behavior are consistent without each screen repeating layout
 *   classes.
 *
 * scroll=true        Forms: keyboard avoidance + a ScrollView that keeps the
 *                    focused field and the submit button reachable while the
 *                    keyboard is open (Android edge-to-edge included).
 * avoidKeyboard=true Non-scroll screens with their own ScrollView + sticky
 *                    footer (e.g. the symptom checklist): the whole screen
 *                    shrinks above the keyboard so the footer rides on top.
 *
 * Bottom inset: inside the tab navigator the tab bar already sits above the
 * system navigation bar, so screens there must NOT pad for it again (that
 * produced an empty strip above the tab bar). Outside tabs (auth screens) the
 * screen itself clears the system navigation bar.
 */
import React, { useContext } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";

import { FormScrollView, KeyboardAvoider } from "./KeyboardAware";

interface ScreenProps {
  children: React.ReactNode;
  /** Use for forms; adds keyboard avoidance + scrolling. */
  scroll?: boolean;
  /** Shrink above the keyboard without adding a ScrollView. */
  avoidKeyboard?: boolean;
}

/** Extra room under the last form control so it never hugs the keyboard. */
const FORM_TAIL = 24;

export function Screen({ children, scroll = false, avoidKeyboard = false }: ScreenProps) {
  // Insets keep content clear of notches and the system navigation bar.
  const insets = useSafeAreaInsets();
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const bottomInset = inTabs ? 0 : insets.bottom;

  if (scroll) {
    return (
      <KeyboardAvoider className="bg-surface-canvas">
        <FormScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingTop: insets.top,
            paddingBottom: bottomInset + FORM_TAIL,
          }}
        >
          {children}
        </FormScrollView>
      </KeyboardAvoider>
    );
  }

  const body = (
    <View
      style={{ paddingTop: insets.top, paddingBottom: bottomInset }}
      className="flex-1 bg-surface-canvas px-5"
    >
      {children}
    </View>
  );

  return avoidKeyboard ? (
    <KeyboardAvoider className="bg-surface-canvas">{body}</KeyboardAvoider>
  ) : (
    body
  );
}
