import { KonvaEventObject } from "konva/lib/Node";
import React, { useCallback, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Image as KonvaImage,
  Circle as KonvaCircle,
  Line as KonvaLine,
  Arrow as KonvaArrow,
  Transformer,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { Arrow, Circle, Rectangle, Scribble } from "./Paint.types";
import {
  CanvasAction,
  DrawAction,
  FILTERS,
  PAINT_CLEAR_OPTIONS,
  PAINT_DRAW_OPTIONS,
  PAINT_MOVE_OPTIONS,
  SCALE_BY,
} from "./Paint.constants";
import { SketchPicker } from "react-color";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { Download, Upload, X, XLg } from "react-bootstrap-icons";

interface PaintProps {}

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 550;

const downloadURI = (uri: string | undefined, name: string) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri || "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getNumericVal = (val: number | undefined) => val || 0;

export const Paint: React.FC<PaintProps> = React.memo(function Paint({}) {
  const currentShapeRef = useRef<string>();
  const isPaintRef = useRef(false);
  const stageRef = useRef<any>();

  const transformerRef = useRef<any>(null);

  const [scribbles, setScribbles] = useState<Scribble[]>([]);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [texts, setTexts] = useState<Text[]>([]);
  const [image, setImage] = useState<HTMLImageElement>();

  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>();
  const [editText, setEditText] = useState("");

  const [canvasHistory, setCanvasHistory] = useState<
    {
      type: CanvasAction;
      drawAction: DrawAction | undefined;
      payload: any;
    }[]
  >([]);
  const [color, setColor] = useState("#000");
  const [drawAction, setDrawAction] = useState<DrawAction>(DrawAction.Scribble);

  const onStageMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);

  const checkDeselect = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty = e.target === stageRef?.current?.find("#bg")?.[0];
      if (clickedOnEmpty) {
        transformerRef?.current?.nodes([]);
      }
    },
    [stageRef]
  );

  const onStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      checkDeselect(e);

      if (drawAction === DrawAction.Select) return;
      isPaintRef.current = true;
      const stage = stageRef?.current;
      const pos = stage?.getPointerPosition();
      const x = getNumericVal(pos?.x);
      const y = getNumericVal(pos?.y);
      const id = uuidv4();
      currentShapeRef.current = id;

      const shouldUpdateCanvasHistory = [
        DrawAction.Arrow,
        DrawAction.Circle,
        DrawAction.Rectangle,
        DrawAction.Scribble,
      ].includes(drawAction);

      shouldUpdateCanvasHistory &&
        setCanvasHistory((prevCanvasHistory) => [
          ...prevCanvasHistory,
          { type: CanvasAction.Add, drawAction, payload: { id } },
        ]);

      switch (drawAction) {
        case DrawAction.Text: {
          setTextPosition({ x, y });
          break;
        }
        case DrawAction.Scribble: {
          setScribbles((prevScribbles) => [
            ...prevScribbles,
            {
              id,
              points: [x, y],
              color,
              scaleX: 1,
              scaleY: 1,
            },
          ]);
          break;
        }
        case DrawAction.Circle: {
          setCircles((prevCircles) => [
            ...prevCircles,
            {
              id,
              radius: 1,
              x,
              y,
              color,
              scaleX: 1,
              scaleY: 1,
            },
          ]);
          break;
        }
        case DrawAction.Rectangle: {
          setRectangles((prevRectangles) => [
            ...prevRectangles,
            {
              id,
              height: 1,
              width: 1,
              x,
              y,
              color,
              scaleX: 1,
              scaleY: 1,
            },
          ]);
          break;
        }
        case DrawAction.Arrow: {
          setArrows((prevArrows) => [
            ...prevArrows,
            {
              id,
              points: [x, y, x, y],
              color,
              scaleX: 1,
              scaleY: 1,
            },
          ]);
          break;
        }
      }
    },
    [checkDeselect, drawAction, color, stageRef]
  );

  const onStageMouseMove = useCallback(() => {
    if (drawAction === DrawAction.Select || !isPaintRef.current) return;

    const stage = stageRef?.current;
    const id = currentShapeRef.current;
    const pos = stage?.getPointerPosition();
    const x = getNumericVal(pos?.x);
    const y = getNumericVal(pos?.y);

    switch (drawAction) {
      case DrawAction.Scribble: {
        setScribbles((prevScribbles) =>
          prevScribbles?.map((prevScribble) =>
            prevScribble.id === id
              ? {
                  ...prevScribble,
                  points: [...prevScribble.points, x, y],
                }
              : prevScribble
          )
        );
        break;
      }
      case DrawAction.Circle: {
        setCircles((prevCircles) =>
          prevCircles?.map((prevCircle) =>
            prevCircle.id === id
              ? {
                  ...prevCircle,
                  radius:
                    ((x - prevCircle.x) ** 2 + (y - prevCircle.y) ** 2) ** 0.5,
                }
              : prevCircle
          )
        );
        break;
      }
      case DrawAction.Rectangle: {
        setRectangles((prevRectangles) =>
          prevRectangles?.map((prevRectangle) =>
            prevRectangle.id === id
              ? {
                  ...prevRectangle,
                  height: y - prevRectangle.y,
                  width: x - prevRectangle.x,
                }
              : prevRectangle
          )
        );
        break;
      }
      case DrawAction.Arrow: {
        setArrows((prevArrows) =>
          prevArrows.map((prevArrow) =>
            prevArrow.id === id
              ? {
                  ...prevArrow,
                  points: [prevArrow.points[0], prevArrow.points[1], x, y],
                }
              : prevArrow
          )
        );
        break;
      }
    }
  }, [drawAction, stageRef]);

  const diagramRef = useRef<any>(null);
  const [currentSelectedShape, setCurrentSelectedShape] = useState<{
    type: DrawAction;
    id: string;
  }>();

  const onShapeClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (drawAction !== DrawAction.Select) return;
      const currentTarget = e.currentTarget;
      setCurrentSelectedShape({
        type: currentTarget?.attrs?.name,
        id: currentTarget?.attrs?.id,
      });
      transformerRef?.current?.node(currentTarget);
    },
    [drawAction]
  );

  const isDraggable = drawAction === DrawAction.Select;
  const isStageDraggable = drawAction === DrawAction.Move;

  let mouseCursor;
  switch (drawAction) {
    case DrawAction.Move: {
      mouseCursor = "grab";
      break;
    }
    case DrawAction.ZoomIn: {
      mouseCursor = "zoom-in";
      break;
    }
    case DrawAction.ZoomOut: {
      mouseCursor = "zoom-out";
      break;
    }
  }

  const getSetterByType = useCallback((type: DrawAction | undefined) => {
    let setter: React.Dispatch<React.SetStateAction<any[]>> | undefined;
    switch (type) {
      case DrawAction.Rectangle:
        setter = setRectangles;
        break;
      case DrawAction.Circle:
        setter = setCircles;
        break;
      case DrawAction.Arrow:
        setter = setArrows;
        break;
      case DrawAction.Scribble:
        setter = setScribbles;
        break;
    }
    return setter;
  }, []);

  const getRecordsByType = useCallback(
    (type: DrawAction | undefined) => {
      let records: any[] | undefined;
      switch (type) {
        case DrawAction.Rectangle:
          records = rectangles;
          break;
        case DrawAction.Circle:
          records = circles;
          break;
        case DrawAction.Arrow:
          records = arrows;
          break;
        case DrawAction.Scribble:
          records = scribbles;
          break;
      }
      return records;
    },
    [arrows, circles, rectangles, scribbles]
  );

  const onTransformStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    setCanvasHistory((prevCanvasHistory) => [
      ...prevCanvasHistory,
      {
        type: CanvasAction.Resize,
        drawAction: e.target.attrs.name,
        payload: {
          id: e.target.attrs.id,
          scaleX: e.target.attrs.scaleX,
          scaleY: e.target.attrs.scaleY,
        },
      },
    ]);
  }, []);

  const onDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    setCanvasHistory((prevCanvasHistory) => [
      ...prevCanvasHistory,
      {
        type: CanvasAction.Drag,
        drawAction: e.target.attrs.name,
        payload: {
          id: e.target.attrs.id,
          x: e.target.attrs.x,
          y: e.target.attrs.y,
        },
      },
    ]);
  }, []);

  const onUndoClick = useCallback(() => {
    const canvasHistoryPayload = [...canvasHistory];
    console.log({ canvasHistoryPayload, canvasHistory });
    const lastAction = canvasHistoryPayload.pop();
    console.log({ lastAction });
    setCanvasHistory(canvasHistoryPayload);

    const setter = getSetterByType(lastAction?.drawAction);
    const id = lastAction?.payload?.id;
    if (!setter) return;
    switch (lastAction?.type) {
      case CanvasAction.Add: {
        transformerRef?.current?.nodes([]);
        setter((prevRecords) =>
          prevRecords.filter((prevRecord) => prevRecord.id !== id)
        );
        break;
      }
      case CanvasAction.Delete: {
        setter((prevRecords) => [...prevRecords, lastAction?.payload?.record]);
        break;
      }
      case CanvasAction.Resize: {
        setter((prevRecords) =>
          prevRecords.map((prevRecord) =>
            prevRecord.id === id
              ? { ...prevRecord, ...lastAction?.payload }
              : prevRecord
          )
        );
        break;
      }
      case CanvasAction.Drag: {
        setter((prevRecords) =>
          prevRecords.map((prevRecord) =>
            prevRecord.id === id
              ? { ...prevRecord, ...lastAction?.payload }
              : prevRecord
          )
        );
        break;
      }
    }
  }, [canvasHistory, getSetterByType]);

  const onDeleteShape = useCallback(() => {
    const setter = getSetterByType(currentSelectedShape?.type);
    const records = getRecordsByType(currentSelectedShape?.type);
    const record = records?.find(
      (record) => record.id === currentSelectedShape?.id
    );
    setCanvasHistory((prevCanvasHistory) => {
      return [
        ...prevCanvasHistory,
        {
          type: CanvasAction.Delete,
          drawAction: currentSelectedShape?.type,
          payload: { id: currentSelectedShape?.id, record },
        },
      ];
    });

    transformerRef?.current?.nodes([]);
    setter &&
      setter((prevRecords) =>
        prevRecords.filter((record) => record.id !== currentSelectedShape?.id)
      );
  }, [getSetterByType, getRecordsByType, currentSelectedShape]);

  const onClear = useCallback(() => {
    setRectangles([]);
    setCircles([]);
    setArrows([]);
    setScribbles([]);
    setImage(undefined);
  }, []);

  const onStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (
        ![DrawAction.ZoomIn, DrawAction.ZoomOut].includes(
          drawAction as DrawAction
        )
      )
        return;

      e.evt.preventDefault();
      const stage = stageRef?.current;

      const oldScale = getNumericVal(stage?.scaleX());
      const pointer = stage?.getPointerPosition() || { x: 0, y: 0 };

      const mousePointTo = {
        x: (pointer?.x - getNumericVal(stage?.x())) / oldScale,
        y: (pointer?.y - getNumericVal(stage?.y())) / oldScale,
      };

      const direction = drawAction === DrawAction.ZoomIn ? 1 : -1;

      const newScale =
        direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

      stage?.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage?.position(newPos);
    },
    [drawAction, stageRef]
  );

  const onDragShapeEnd = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const type = e.target?.attrs?.name;
      const id = e.target?.attrs?.id;

      const setter = getSetterByType(type);
      setter &&
        setter((prevRecords) =>
          prevRecords.map((record) =>
            record.id === id
              ? { ...record, x: e.target.x(), y: e.target.y() }
              : record
          )
        );
    },
    [getSetterByType]
  );

  const onImportImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        const imageURL = URL.createObjectURL(e.target.files[0]);
        const image = new Image(CANVAS_WIDTH / 2, CANVAS_WIDTH / 2);
        image.src = imageURL;
        setImage(image);
      }
      e.target.files = null;
    },
    []
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const onImportImageClick = useCallback(() => {
    fileRef?.current && fileRef?.current?.click();
  }, []);
  const onExportClick = useCallback(() => {
    const dataURL = stageRef?.current?.toDataURL({ pixelRatio: 3 });
    downloadURI(dataURL, "image.png");
  }, []);

  const onClearOptionClick = useCallback(
    (action: DrawAction) => {
      switch (action) {
        case DrawAction.Erase: {
          onClear();
          break;
        }
        case DrawAction.Delete: {
          onDeleteShape();
          break;
        }
        case DrawAction.Undo: {
          onUndoClick();
          break;
        }
      }
    },
    [onClear, onDeleteShape, onUndoClick]
  );

  return (
    <Flex justifyContent={"center"} m={4}>
      <Box width={`${CANVAS_WIDTH}px`}>
        <Flex justifyContent={"center"}>
          <Flex gap={2} alignItems="center">
            <img src="/paint.png" width={20} />
            <Text fontSize={"xl"}>Paint it</Text>
          </Flex>
        </Flex>
        <Flex justifyContent={"space-between"} alignItems="center" mt={4}>
          <Flex gap={6} alignItems="center">
            {/*TODO: Investigate Drawing Issue while panning, zoom */}
            {/* <ButtonGroup size="sm" isAttached variant="solid">
            {PAINT_MOVE_OPTIONS.map(({ id, label, icon }) => (
              <IconButton
                aria-label={label}
                icon={icon}
                onClick={() => setDrawAction(id)}
                colorScheme={id === drawAction ? "whatsapp" : undefined}
              />
            ))}
          </ButtonGroup> */}
            <ButtonGroup size="sm" isAttached variant="solid">
              {PAINT_DRAW_OPTIONS.map(({ id, label, icon }) => (
                <IconButton
                  aria-label={label}
                  icon={icon}
                  onClick={() => setDrawAction(id)}
                  colorScheme={id === drawAction ? "whatsapp" : undefined}
                />
              ))}
            </ButtonGroup>
            <ButtonGroup size="sm" isAttached variant="solid">
              {PAINT_CLEAR_OPTIONS.map(({ id, label, icon }) => (
                <IconButton
                  aria-label={label}
                  icon={icon}
                  onClick={() => onClearOptionClick(id)}
                  isDisabled={
                    (id === DrawAction.Undo && !canvasHistory?.length) ||
                    (id === DrawAction.Delete && !currentSelectedShape)
                  }
                />
              ))}
            </ButtonGroup>
            <Popover>
              <PopoverTrigger>
                <Box
                  bg={color}
                  h={"32px"}
                  w={"32px"}
                  borderRadius="lg"
                  cursor="pointer"
                ></Box>
              </PopoverTrigger>
              <PopoverContent width="300">
                <PopoverArrow />
                <PopoverCloseButton />
                {/*@ts-ignore*/}
                <SketchPicker
                  color={color}
                  onChangeComplete={(selectedColor) =>
                    setColor(selectedColor.hex)
                  }
                />
              </PopoverContent>
            </Popover>
          </Flex>

          <Flex gap={4} alignItems="center" height="100%">
            <input
              type="file"
              ref={fileRef}
              onChange={onImportImageSelect}
              style={{ display: "none" }}
            />
            <Button
              leftIcon={<Upload />}
              variant="solid"
              onClick={onImportImageClick}
              size="sm"
            >
              Import Image
            </Button>
            <Button
              leftIcon={<Download />}
              colorScheme="whatsapp"
              variant="solid"
              onClick={onExportClick}
              size="sm"
            >
              Export
            </Button>
          </Flex>
        </Flex>

        <Box
          width={`${CANVAS_WIDTH}px`}
          height={`${CANVAS_HEIGHT}px`}
          border="1px solid black"
          mt={4}
          overflow="hidden"
        >
          <Stage
            height={CANVAS_HEIGHT}
            width={CANVAS_WIDTH}
            ref={stageRef}
            onMouseUp={onStageMouseUp}
            draggable={isStageDraggable}
            onMouseDown={onStageMouseDown}
            onMouseMove={onStageMouseMove}
            onClick={onStageClick}
          >
            <Layer>
              <KonvaRect
                x={0}
                y={0}
                height={CANVAS_HEIGHT}
                width={CANVAS_WIDTH}
                fill="white"
                id="bg"
              />
              <KonvaImage
                ref={diagramRef}
                image={image}
                x={0}
                y={0}
                height={CANVAS_WIDTH / 2}
                width={CANVAS_WIDTH / 2}
                onClick={onShapeClick}
                draggable={isDraggable}
              />
              {rectangles?.map((rectangle) => (
                <KonvaRect
                  key={rectangle.id}
                  x={rectangle?.x}
                  y={rectangle?.y}
                  onClick={onShapeClick}
                  height={rectangle?.height}
                  width={rectangle?.width}
                  stroke={rectangle?.color}
                  name={DrawAction.Rectangle}
                  id={rectangle.id}
                  strokeWidth={4}
                  draggable={isDraggable}
                  onDragStart={onDragStart}
                  onTransformStart={onTransformStart}
                  onDragEnd={onDragShapeEnd}
                  scaleX={rectangle.scaleX}
                  scaleY={rectangle.scaleY}
                />
              ))}
              {circles?.map((circle) => (
                <KonvaCircle
                  name={DrawAction.Circle}
                  key={circle.id}
                  id={circle.id}
                  x={circle?.x}
                  y={circle?.y}
                  radius={circle?.radius}
                  stroke={circle?.color}
                  strokeWidth={4}
                  draggable={isDraggable}
                  onClick={onShapeClick}
                  onDragStart={onDragStart}
                  onDragEnd={onDragShapeEnd}
                  onTransformStart={onTransformStart}
                  scaleX={circle.scaleX}
                  scaleY={circle.scaleY}
                />
              ))}
              {scribbles.map((scribble) => (
                <KonvaLine
                  key={scribble.id}
                  id={scribble.id}
                  lineCap="round"
                  lineJoin="round"
                  stroke={scribble?.color}
                  strokeWidth={4}
                  points={scribble.points}
                  name={DrawAction.Scribble}
                  onClick={onShapeClick}
                  draggable={isDraggable}
                  onDragStart={onDragStart}
                  onDragEnd={onDragShapeEnd}
                  onTransformStart={onTransformStart}
                  scaleX={scribble.scaleX}
                  scaleY={scribble.scaleY}
                />
              ))}
              {arrows.map((arrow) => (
                <KonvaArrow
                  name={DrawAction.Arrow}
                  key={arrow.id}
                  id={arrow.id}
                  points={arrow.points}
                  fill={arrow.color}
                  stroke={arrow.color}
                  strokeWidth={4}
                  onClick={onShapeClick}
                  draggable={isDraggable}
                  onDragStart={onDragStart}
                  onDragEnd={onDragShapeEnd}
                  onTransformStart={onTransformStart}
                  scaleX={arrow.scaleX}
                  scaleY={arrow.scaleY}
                />
              ))}
              <Transformer ref={transformerRef} rotateEnabled={false} />
            </Layer>
          </Stage>
        </Box>
      </Box>
    </Flex>
  );
});
