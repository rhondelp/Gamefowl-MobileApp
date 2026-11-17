/**
 * Tests for hooks/useResponsive.ts and the grid helpers — pins the window
 * size-class breakpoints (600 / 840) and that phones (compact) always get
 * the original single-column, uncapped layout.
 */
import { sizeForWidth } from "../hooks/useResponsive";
import { columnStyle, gridKey, gridListProps } from "../components/ui/Responsive";

describe("sizeForWidth", () => {
  it("treats every phone width as compact", () => {
    expect(sizeForWidth(320)).toBe("compact");
    expect(sizeForWidth(430)).toBe("compact");
    expect(sizeForWidth(599)).toBe("compact");
  });

  it("switches to medium at 600 and expanded at 840", () => {
    expect(sizeForWidth(600)).toBe("medium");
    expect(sizeForWidth(839)).toBe("medium");
    expect(sizeForWidth(840)).toBe("expanded");
    expect(sizeForWidth(1280)).toBe("expanded");
  });
});

describe("columnStyle", () => {
  it("is a no-op on phones", () => {
    expect(columnStyle(false, "form")).toBeUndefined();
    expect(columnStyle(false, "list", true)).toBeUndefined();
  });

  it("caps and centers on tablets, optionally including the gutters", () => {
    expect(columnStyle(true, "form")).toEqual({
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
    });
    expect(columnStyle(true, "list", true)?.maxWidth).toBe(1040);
  });
});

describe("gridListProps", () => {
  it("omits columnWrapperStyle for single-column lists (RN rejects it)", () => {
    expect(gridListProps(1)).toEqual({ numColumns: 1, columnWrapperStyle: undefined });
  });

  it("adds a negative gutter for multi-column rows", () => {
    expect(gridListProps(3).numColumns).toBe(3);
    expect(gridListProps(3).columnWrapperStyle).toEqual({ marginHorizontal: -6 });
  });

  it("keys the list by column count so FlatList remounts on change", () => {
    expect(gridKey(1)).not.toBe(gridKey(2));
  });
});
