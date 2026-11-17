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
 * width              Max content width on tablets/foldables: "form" (480,
 *                    default for scroll screens), "content" (720, default
 *                    otherwise) or "list" (1000). No effect on phones.
 *
 * Bottom inset: inside the tab navigator the tab bar already sits above the
 * system navigation bar, so screens there must NOT pad for it again (that
 * produced an empty strip above the tab bar). Outside tabs (auth screens) the
 * screen itself clears the system navigation bar.
 *
 * Side insets: in landscape the 3-button navigation bar (and display
 * cutouts) can sit on the left/right edge, so those insets are padded too.
 * On a portrait phone they are 0.
 */
import React, { useContext } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";

import { FormScrollView, KeyboardAvoider } from "./KeyboardAware";
import { columnStyle } from "./Responsive";
import { SCREEN_GUTTER, useResponsive, type ContentWidth } from "../../hooks/useResponsive";

interface ScreenProps {
  children: React.ReactNode;
  /** Use for forms; adds keyboard avoidance + scrolling. */
  scroll?: boolean;
  /** Shrink above the keyboard without adding a ScrollView. */
  avoidKeyboard?: boolean;
  /** Max content width on large screens. */
  width?: ContentWidth;
}

/** Extra room under the last form control so it never hugs the keyboard. */
const FORM_TAIL = 24;

export function Screen({
  children,
  scroll = false,
  avoidKeyboard = false,
  width,
}: ScreenProps) {
  // Insets keep content clear of notches and the system navigation bar.
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const bottomInset = inTabs ? 0 : insets.bottom;
  const column = columnStyle(isTablet, width ?? (scroll ? "form" : "content"), true);

  if (scroll) {
    return (
      <KeyboardAvoider className="bg-surface-canvas">
        <FormScrollView
          // The ScrollView itself spans the screen (so the margins scroll
          // too); only its content is capped and centered.
          style={{ marginLeft: insets.left, marginRight: insets.right }}
          contentContainerStyle={[
            {
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: SCREEN_GUTTER,
              paddingTop: insets.top,
              paddingBottom: bottomInset + FORM_TAIL,
            },
            column,
          ]}
        >
          {children}
        </FormScrollView>
      </KeyboardAvoider>
    );
  }

  const body = (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: bottomInset,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      className="flex-1 bg-surface-canvas"
    >
      <View className="flex-1 px-5" style={column}>
        {children}
      </View>
    </View>
  );

  return avoidKeyboard ? (
    <KeyboardAvoider className="bg-surface-canvas">{body}</KeyboardAvoider>
  ) : (
    body
  );
}
