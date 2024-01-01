import { useEffect } from "react";
import { DrawAction } from "./Paint.constants";

export const usePaintKeyBindings = ({
  onAction,
}: {
  onAction: (action: DrawAction) => void;
}) => {
  // TODO: To be replaced with useEffectEvent when released
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (true) {
        case e.ctrlKey && e.key === "z": {
          onAction(DrawAction.Undo);
          break;
        }
        case e.ctrlKey && e.key === "d": {
          onAction(DrawAction.Delete);
          break;
        }
        case e.ctrlKey && e.key === "k": {
          onAction(DrawAction.Clear);
          break;
        }
        case e.key === "s": {
          onAction(DrawAction.Select);
          break;
        }
        case e.key === "r": {
          onAction(DrawAction.Rectangle);
          break;
        }
        case e.key === "c": {
          onAction(DrawAction.Circle);
          break;
        }
        case e.key === "a": {
          onAction(DrawAction.Arrow);
          break;
        }
        case e.key === "f": {
          onAction(DrawAction.Scribble);
          break;
        }
        // TODO: Add Actions for Import/Export
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAction]);
};
