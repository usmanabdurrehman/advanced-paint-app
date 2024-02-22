import {
  ArrowClockwise,
  ArrowsMove,
  ArrowUpLeft,
  ArrowUpLeftSquareFill,
  Circle,
  CursorText,
  EraserFill,
  Pencil,
  Square,
  Trash,
  XLg,
  ZoomIn,
  ZoomOut,
} from "react-bootstrap-icons";
import Konva from "konva";

export enum DrawAction {
  ZoomOut = "zoomOut",
  ZoomIn = "zoomIn",
  Move = "move",
  Select = "select",
  Text = "text",
  Rectangle = "rectangle",
  Circle = "circle",
  Scribble = "freedraw",
  Arrow = "arrow",
  Delete = "delete",
  Clear = "clear",
  Undo = "undo",
  Eraser = "eraser",
}

export const FILTERS = [
  Konva.Filters.Blur,
  Konva.Filters.Brighten,
  Konva.Filters.HSL,
];

export const PAINT_MOVE_OPTIONS = [
  { id: DrawAction.Move, label: "Pan Canvas", icon: <ArrowsMove /> },
  { id: DrawAction.ZoomIn, label: "Zoom In Canvas", icon: <ZoomIn /> },
  { id: DrawAction.ZoomOut, label: "Zoom Out Canvas", icon: <ZoomOut /> },
];

export const PAINT_DRAW_OPTIONS = [
  {
    id: DrawAction.Select,
    label: "Select Shapes",
    icon: <ArrowUpLeftSquareFill />,
  },
  { id: DrawAction.Text, label: "Text", icon: <CursorText /> },
  { id: DrawAction.Rectangle, label: "Draw Rectangle Shape", icon: <Square /> },
  { id: DrawAction.Circle, label: "Draw Cirle Shape", icon: <Circle /> },
  { id: DrawAction.Arrow, label: "Draw Arrow Shape", icon: <ArrowUpLeft /> },
  { id: DrawAction.Scribble, label: "Scribble", icon: <Pencil /> },
  // TODO: Eraser tool just draws over lines so find a way to make it work for cases where we want to move stuff
  // { id: DrawAction.Eraser, label: "Eraser", icon: <EraserFill /> },
];

export const PAINT_CLEAR_OPTIONS = [
  {
    id: DrawAction.Delete,
    label: "Delete Shape",
    icon: <Trash />,
  },
  { id: DrawAction.Clear, label: "Clear Whole Canvas", icon: <XLg /> },
  { id: DrawAction.Undo, label: "Undo Action", icon: <ArrowClockwise /> },
];

export const BASE_FONT_SIZE = 16;
export const SCALE_BY = 1.1;

export enum CanvasAction {
  Add = "add",
  Delete = "delete",
  Resize = "resize",
  Drag = "drag",
}
