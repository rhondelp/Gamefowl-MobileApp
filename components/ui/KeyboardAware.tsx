/**
 * File: components/ui/KeyboardAware.tsx
 *
 * Purpose:
 *   Keyboard handling that works on Android edge-to-edge (always on since
 *   Expo SDK 54), where the window no longer resizes for the keyboard.
 *
 *   KeyboardAvoider
 *     Pads its bottom by exactly the part of it the keyboard covers. Unlike
 *     RN's KeyboardAvoidingView (which compares its PARENT-relative frame to
 *     the keyboard's SCREEN position and so needs a hand-tuned
 *     keyboardVerticalOffset under every header / inside every tab), this
 *     measures its own window position at the moment the keyboard appears —
 *     so it is correct on auth screens, under native-stack headers, and
 *     above the tab bar alike, after any screen transition has finished.
 *
 *   FormScrollView
 *     A ScrollView that re-reveals the focused input once the keyboard has
 *     shrunk it. Android scrolls to a field only at focus time — BEFORE the
 *     viewport shrinks — so a lower field could end up hidden under the
 *     keyboard with nothing scrolling it back.
 *
 * Pure layout: no props or callbacks of the wrapped forms are touched.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  TextInput,
  View,
  type KeyboardEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

/** Breathing room kept between a revealed field and the keyboard/edges. */
const REVEAL_MARGIN = 24;

/**
 * ScrollView#getInnerViewRef exists at runtime (RN Flow types) but is missing
 * from the shipped .d.ts. The typed alternative, getInnerViewNode(), returns
 * a numeric tag that Fabric's measureLayout rejects — the ref is required.
 */
function innerViewOf(scroll: ScrollView): React.ComponentRef<typeof View> | null {
  const withRef = scroll as unknown as {
    getInnerViewRef?: () => React.ComponentRef<typeof View> | null;
  };
  return withRef.getInnerViewRef?.() ?? null;
}

interface KeyboardAvoiderProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyboardAvoider({ children, className }: KeyboardAvoiderProps) {
  const ref = useRef<View>(null);
  const [bottom, setBottom] = useState(0);
  const bottomRef = useRef(0);

  useEffect(() => {
    // iOS reports the final frame in its "will" events (smoother); Android
    // only emits "did" events.
    const showEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const apply = (next: number, event?: KeyboardEvent) => {
      if (next === bottomRef.current) return;
      bottomRef.current = next;
      LayoutAnimation.configureNext({
        duration: Math.max(event?.duration || 0, 180),
        update: { type: LayoutAnimation.Types.keyboard },
      });
      setBottom(next);
    };

    const onShow = (event: KeyboardEvent) => {
      const keyboardTop = event.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, height) => {
        // Edge-to-edge: window coords == screen coords, the same space as
        // the keyboard's screenY.
        apply(Math.max(0, Math.round(y + height - keyboardTop)), event);
      });
    };
    const onHide = (event: KeyboardEvent) => apply(0, event);

    const show = Keyboard.addListener(showEvent, onShow);
    const hide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    // The outer view keeps a constant frame (that's what gets measured);
    // only the inner padding changes.
    <View ref={ref} className={`flex-1 ${className ?? ""}`} style={{ paddingBottom: bottom }}>
      {children}
    </View>
  );
}

/**
 * Drop-in ScrollView for forms: taps on buttons work while the keyboard is
 * open, and the focused field is scrolled back into view whenever the
 * viewport shrinks (keyboard opening) or the keyboard finishes appearing.
 */
export function FormScrollView({
  children,
  onLayout,
  onScroll,
  ...rest
}: ScrollViewProps & { children: React.ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const viewportH = useRef(0);

  const revealFocusedInput = useCallback(() => {
    const scroll = scrollRef.current;
    const focused = TextInput.State.currentlyFocusedInput();
    const inner = scroll ? innerViewOf(scroll) : null;
    if (!scroll || !focused || !inner || viewportH.current <= 0) return;

    focused.measureLayout(
      inner,
      (_x, y, _w, h) => {
        const visibleTop = scrollY.current;
        const visibleBottom = visibleTop + viewportH.current;
        const fieldBottom = y + h + REVEAL_MARGIN;
        const fieldTop = Math.max(0, y - REVEAL_MARGIN);
        if (fieldBottom > visibleBottom) {
          // Prefer showing the field's bottom; never scroll its top away.
          scroll.scrollTo({ y: Math.min(fieldTop, fieldBottom - viewportH.current), animated: true });
        } else if (fieldTop < visibleTop) {
          scroll.scrollTo({ y: fieldTop, animated: true });
        }
      },
      // Focused input lives outside this ScrollView — nothing to do.
      () => {}
    );
  }, []);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      // Let the avoider's padding settle into layout first.
      requestAnimationFrame(revealFocusedInput);
    });
    return () => sub.remove();
  }, [revealFocusedInput]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    const shrank = viewportH.current > 0 && next < viewportH.current;
    viewportH.current = next;
    if (shrank) revealFocusedInput();
    onLayout?.(event);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
      scrollEventThrottle={16}
      {...rest}
      onLayout={handleLayout}
      onScroll={handleScroll}
    >
      {children}
    </ScrollView>
  );
}
