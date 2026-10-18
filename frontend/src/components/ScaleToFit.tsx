import React, { useCallback, useEffect, useRef, useState } from "react";

interface ScaleToFitProps {
  /** The natural (unscaled) width of the content in px, e.g. 850 for the report card. */
  contentWidth: number;
  /**
   * Only scale down below this viewport width. Above it the content renders at
   * natural size (scale = 1). Defaults to `contentWidth` so it only shrinks when
   * the screen is narrower than the content.
   */
  maxWidth?: number;
  children: React.ReactNode;
}

/**
 * Scales its child down to fit the available width WITHOUT the usual
 * `transform: scale()` pitfalls.
 *
 * A bare `transform: scale()` only changes the visual size — the element still
 * occupies its full un-scaled width and height in layout. On mobile that means a
 * fixed-width (e.g. 850px) report card overflows the viewport horizontally and
 * leaves a large blank gap below it (the un-scaled height is still reserved).
 * With `overflow-x: hidden` on the body, the card looks cut off / broken.
 *
 * This wrapper measures the child's natural height and reserves the *scaled*
 * width and height on an outer box, so the layout collapses to exactly what is
 * visible — no horizontal overflow, no empty space.
 */
const ScaleToFit: React.FC<ScaleToFitProps> = ({ contentWidth, maxWidth, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const available = container.clientWidth;
    const limit = maxWidth ?? contentWidth;

    // Only scale down when the available width is smaller than the content.
    const nextScale = available >= limit ? 1 : Math.max(0, available / contentWidth);

    setScale(nextScale);
    // Measure the natural (unscaled) height of the content.
    setContentHeight(content.offsetHeight);
  }, [contentWidth, maxWidth]);

  useEffect(() => {
    recompute();

    const content = contentRef.current;
    // Re-measure when content size changes (images loading, data changes, etc.)
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && content) {
      ro = new ResizeObserver(() => recompute());
      ro.observe(content);
    }

    window.addEventListener("resize", recompute);
    window.addEventListener("orientationchange", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("orientationchange", recompute);
      ro?.disconnect();
    };
  }, [recompute]);

  return (
    <div ref={containerRef} className="scale-to-fit" style={{ width: "100%" }}>
      {/* Outer box reserves the SCALED footprint so no overflow / empty gap remains. */}
      <div
        className="scale-to-fit-box"
        style={{
          width: contentWidth * scale,
          height: contentHeight != null ? contentHeight * scale : undefined,
          margin: "0 auto",
        }}
      >
        <div
          ref={contentRef}
          className="scale-to-fit-content"
          style={{
            width: contentWidth,
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ScaleToFit;
