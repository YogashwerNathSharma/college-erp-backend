// Fix react-icons v5 + TypeScript 6 compatibility
// IconBaseProps extends SVGAttributes which should include className,
// but TS6's stricter type resolution doesn't always pick it up.
import "react";

declare module "react" {
  interface SVGAttributes<T> {
    className?: string | undefined;
  }
}
