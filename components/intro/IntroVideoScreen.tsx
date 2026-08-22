/**
 * File: components/intro/IntroVideoScreen.tsx
 *
 * Purpose:
 *   In-app animated intro shown on cold launch, BEFORE the Milestone 9
 *   auth-check splash. Expo's native splash supports only static images,
 *   so the animated branding plays here instead (Milestone 15 decision).
 *
 *   Wiring status: fully implemented but DORMANT — nothing imports this
 *   module until `assets/videos/intro.mp4` exists, because Metro resolves
 *   asset requires statically and would fail on a missing file. To activate
 *   in the follow-up pass, render from App.tsx:
 *
 *     import { IntroVideoScreen } from "./components/intro/IntroVideoScreen";
 *     ...
 *     <IntroVideoScreen videoSource={require("./assets/videos/intro.mp4")} onFinish={...} />
 *
 *   Guarantees per spec: auto-plays muted, NEVER traps the user (tap
 *   anywhere or press Skip), and a load failure/timeout finishes
 *   automatically so core functionality is never gated by the video.
 */
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

interface IntroVideoScreenProps {
  /** require("./assets/videos/intro.mp4") — supplied by the parent. */
  videoSource: number;
  /** Called on video end, skip tap, error, or safety timeout. */
  onFinish: () => void;
}

/** Hard ceiling so a broken asset can never hold the user hostage. */
const SAFETY_TIMEOUT_MS = 8000;

export function IntroVideoScreen({ videoSource, onFinish }: IntroVideoScreenProps) {
  const finishedRef = useRef(false);

  const finish = () => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      onFinish();
    }
  };

  const player = useVideoPlayer(videoSource, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const endSub = player.addListener("playToEnd", finish);
    const errorSub = player.addListener("statusChange", (status) => {
      if (status.error) finish();
    });
    const safety = setTimeout(finish, SAFETY_TIMEOUT_MS);
    return () => {
      endSub.remove();
      errorSub.remove();
      clearTimeout(safety);
      player.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <Pressable style={styles.root} accessibilityRole="button" onPress={finish}>
      <VideoView
        player={player}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
      />
      {/* Visible, reachable skip affordance — never trap the viewer. */}
      <Pressable
        accessibilityRole="button"
        onPress={finish}
        style={styles.skip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#123122" },
  skip: {
    position: "absolute",
    right: 20,
    bottom: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  skipText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
});
