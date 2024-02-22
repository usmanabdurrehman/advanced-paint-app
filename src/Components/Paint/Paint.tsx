import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Image as KonvaImage,
  Circle as KonvaCircle,
  Line as KonvaLine,
  Arrow as KonvaArrow,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { Arrow, Circle, Rectangle, Scribble, Text } from "./Paint.types";
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
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Text as ChakraText,
} from "@chakra-ui/react";
import { DiamondHalf, Download, Upload } from "react-bootstrap-icons";
import { usePaintKeyBindings } from "./usePaintKeyBindings";
import { FEATURE_FLAGS } from "../../constants";

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

  const [{ x: stageX, y: stageY }, setStageXY] = useState({ x: 0, y: 0 });

  const [scribbles, setScribbles] = useState<Scribble[]>([]);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [texts, setTexts] = useState<Text[]>([]);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

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
  const inputRef = useRef<HTMLInputElement>(null);

  const onBlurTextField = useCallback(() => {
    setTextPosition(undefined);
    const id = currentShapeRef?.current;
    if (!id || !textPosition) return;
    setTexts((prevTexts) => [
      ...prevTexts,
      {
        id,
        x: textPosition?.x,
        y: textPosition?.y,
        text: editText,
        color: color,
        scaleX: 1,
        scaleY: 1,
      },
    ]);
    setEditText("");
  }, [editText, color, textPosition]);

  const onStageMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);

  const [currentSelectedShape, setCurrentSelectedShape] = useState<{
    type: DrawAction;
    id: string;
    node: Node<NodeConfig>;
  }>();

  const deSelect = useCallback(() => transformerRef?.current?.nodes([]), []);

  const checkDeselect = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // This stopped working for some reason
      // const clickedOnEmpty = e.target === stageRef?.current?.find("#bg")?.[0];
      const clickedOnEmpty = e.target === stageRef?.current;
      if (clickedOnEmpty) {
        deSelect();
      }
    },
    [stageRef, deSelect]
  );

  const onStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      checkDeselect(e);

      if (drawAction === DrawAction.Select) return;
      isPaintRef.current = true;
      const stage = stageRef?.current;
      const pos = stage?.getPointerPosition();
      const x = getNumericVal(pos?.x) - stageX;
      const y = getNumericVal(pos?.y) - stageY;
      const id = uuidv4();
      currentShapeRef.current = id;

      const shouldUpdateCanvasHistory = [
        DrawAction.Arrow,
        DrawAction.Circle,
        DrawAction.Rectangle,
        DrawAction.Scribble,
        DrawAction.Text,
      ].includes(drawAction);

      shouldUpdateCanvasHistory &&
        setCanvasHistory((prevCanvasHistory) => [
          ...prevCanvasHistory,
          { type: CanvasAction.Add, drawAction, payload: { id } },
        ]);

      switch (drawAction) {
        case DrawAction.Text: {
          onBlurTextField();
          setTextPosition({ x, y });
          break;
        }
        case DrawAction.Scribble:
        case DrawAction.Eraser: {
          setScribbles((prevScribbles) => [
            ...prevScribbles,
            {
              id,
              points: [x, y, x, y],
              color,
              scaleX: 1,
              scaleY: 1,
              isBrush: drawAction === DrawAction.Scribble,
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
    [
      checkDeselect,
      drawAction,
      color,
      stageRef,
      stageX,
      stageY,
      onBlurTextField,
    ]
  );

  const onStageMouseMove = useCallback(() => {
    if (drawAction === DrawAction.Select || !isPaintRef.current) return;

    const stage = stageRef?.current;
    const id = currentShapeRef.current;
    const pos = stage?.getPointerPosition();
    const x = getNumericVal(pos?.x) - stageX;
    const y = getNumericVal(pos?.y) - stageY;

    switch (drawAction) {
      case DrawAction.Scribble:
      case DrawAction.Eraser: {
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
  }, [drawAction, stageRef, stageX, stageY]);

  const onShapeClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (drawAction !== DrawAction.Select) return;
      const currentTarget = e.currentTarget;
      setCurrentSelectedShape({
        type: currentTarget?.attrs?.name,
        id: currentTarget?.attrs?.id,
        node: currentTarget,
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
      case DrawAction.Text:
        setter = setTexts;
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
        case DrawAction.Text:
          records = texts;
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
    const lastAction = canvasHistoryPayload.pop();
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
    setCurrentSelectedShape(undefined);
  }, [getSetterByType, getRecordsByType, currentSelectedShape]);

  const onClear = useCallback(() => {
    setRectangles([]);
    setCircles([]);
    setArrows([]);
    setScribbles([]);
    setImages([]);
    setTexts([]);
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

  const onTransformEnd = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const type = e.target?.attrs?.name;
      const id = e.target?.attrs?.id;

      const setter = getSetterByType(type);
      setter &&
        setter((prevRecords) =>
          prevRecords.map((record) =>
            record.id === id
              ? {
                  ...record,
                  scaleX: e.target.attrs.scaleX,
                  scaleY: e.target.attrs.scaleY,
                }
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
        setImages((prevImages) => [...prevImages, image]);
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
        case DrawAction.Clear: {
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

  const onAction = useCallback(
    (action: DrawAction) => {
      switch (action) {
        case DrawAction.Rectangle:
        case DrawAction.Circle:
        case DrawAction.Scribble:
        case DrawAction.Arrow:
        case DrawAction.Select: {
          setDrawAction(action);
          break;
        }
        default: {
          onClearOptionClick(action);
        }
      }
    },
    [onClearOptionClick]
  );

  usePaintKeyBindings({ onAction, isWritingInProgress: !!textPosition });

  const [filters, setFilters] = useState({
    brightness: 0,
    blur: 0,
    saturation: 4,
    hue: 0,
  });

  const backgroundRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [inputRef]);

  return (
    <Flex
      justifyContent={"center"}
      m={4}
      css={`
        @import url("https://fonts.googleapis.com/css2?family=Aguafina+Script&display=swap");
      `}
    >
      <Box width={`${CANVAS_WIDTH}px`}>
        <Flex justifyContent={"center"}>
          <Flex gap={2} alignItems="center">
            <img src="/paint.png" width={40} />
            <ChakraText
              fontSize={"xx-large"}
              fontFamily={`"Aguafina Script", cursive`}
            >
              Paint it
            </ChakraText>
          </Flex>
        </Flex>
        <Flex justifyContent={"space-between"} alignItems="center" mt={4}>
          <Flex gap={6} alignItems="center">
            {/*TODO: Investigate Drawing Issue while panning, zoom */}
            {FEATURE_FLAGS.MoveActionButtons && (
              <ButtonGroup size="sm" isAttached variant="solid">
                {PAINT_MOVE_OPTIONS.map(({ id, label, icon }) => (
                  <IconButton
                    aria-label={label}
                    icon={icon}
                    onClick={() => setDrawAction(id)}
                    colorScheme={id === drawAction ? "whatsapp" : undefined}
                  />
                ))}
              </ButtonGroup>
            )}
            <ButtonGroup size="sm" isAttached variant="solid">
              {PAINT_DRAW_OPTIONS.map(({ id, label, icon }) => (
                <IconButton
                  aria-label={label}
                  icon={icon}
                  onClick={() => {
                    deSelect();
                    onBlurTextField();
                    setDrawAction(id);
                  }}
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
            <Popover>
              <PopoverTrigger>
                <IconButton
                  size="sm"
                  icon={<DiamondHalf />}
                  aria-label="Filters"
                />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />

                <Box p={4}>
                  <FormControl>
                    <FormLabel>Brightness</FormLabel>
                    <RangeSlider
                      aria-label={["min", "max"]}
                      min={-1}
                      max={1}
                      step={0.01}
                      value={[filters.brightness]}
                      onChange={([value]) => {
                        const images = stageRef?.current?.find(".image");

                        images?.forEach((image: any) => {
                          image?.cache();
                          image?.saturation(value);
                        });

                        setFilters({ ...filters, brightness: value });
                      }}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                    </RangeSlider>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Blur</FormLabel>
                    <RangeSlider
                      aria-label={["min", "max"]}
                      min={0}
                      max={40}
                      step={2}
                      value={[filters.blur]}
                      onChange={([value]) => {
                        const images = stageRef?.current?.find(".image");

                        images?.forEach((image: any) => {
                          image?.cache();
                          image?.blurRadius(value);
                        });

                        setFilters({ ...filters, blur: value });
                      }}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                    </RangeSlider>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Saturation</FormLabel>
                    <RangeSlider
                      aria-label={["min", "max"]}
                      min={-2}
                      max={10}
                      step={0.01}
                      value={[filters.saturation]}
                      onChange={([value]) => {
                        const images = stageRef?.current?.find(".image");

                        images?.forEach((image: any) => {
                          image?.cache();
                          image?.saturation(value);
                        });

                        setFilters({ ...filters, saturation: value });
                      }}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                    </RangeSlider>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Hue</FormLabel>
                    <RangeSlider
                      aria-label={["min", "max"]}
                      min={0}
                      max={259}
                      step={1}
                      value={[filters.hue]}
                      onChange={([value]) => {
                        const images = stageRef?.current?.find(".image");

                        images?.forEach((image: any) => {
                          image?.cache();
                          image?.hue(value);
                        });

                        setFilters({ ...filters, hue: value });
                      }}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                    </RangeSlider>
                  </FormControl>
                </Box>
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
          pos={"relative"}
          cursor={mouseCursor}
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
            x={stageX}
            y={stageY}
            onDragEnd={(e: KonvaEventObject<MouseEvent>) => {
              // setStageXY({ x: e.target.x(), y: e.target.y() });
            }}
            onDragMove={() => {
              backgroundRef?.current?.absolutePosition({ x: 0, y: 0 });
            }}
          >
            <Layer>
              <KonvaRect
                ref={backgroundRef}
                x={0}
                y={0}
                height={CANVAS_HEIGHT}
                width={CANVAS_WIDTH}
                fill={"white"}
                id="bg"
                listening={false}
              />
              {images.map((image, index) => (
                <KonvaImage
                  key={index}
                  image={image}
                  x={0}
                  y={0}
                  height={CANVAS_WIDTH / 2}
                  width={CANVAS_WIDTH / 2}
                  onClick={onShapeClick}
                  draggable={isDraggable}
                  name="image"
                  filters={FILTERS}
                />
              ))}
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
                  onTransformEnd={onTransformEnd}
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
                  onTransformEnd={onTransformEnd}
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
                  onTransformEnd={onTransformEnd}
                  scaleX={scribble.scaleX}
                  scaleY={scribble.scaleY}
                  globalCompositeOperation={
                    scribble.isBrush ? "source-over" : "destination-out"
                  }
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
                  onTransformEnd={onTransformEnd}
                  scaleX={arrow.scaleX}
                  scaleY={arrow.scaleY}
                />
              ))}
              {texts.map((text) => (
                <KonvaText
                  name={DrawAction.Text}
                  key={text.id}
                  text={text.text}
                  id={text.id}
                  x={text.x}
                  y={text.y}
                  stroke={text.color}
                  draggable={isDraggable}
                  strokeWidth={0.2}
                  onDragStart={onDragStart}
                  onDragEnd={onDragShapeEnd}
                  onTransformStart={onTransformStart}
                  onTransformEnd={onTransformEnd}
                  onClick={onShapeClick}
                  scaleX={text.scaleX}
                  scaleY={text.scaleY}
                  fontSize={14}
                />
              ))}
              <Transformer ref={transformerRef} rotateEnabled={false} />
            </Layer>
          </Stage>
          {textPosition && (
            <Input
              style={{
                position: "absolute",
                top: textPosition.y,
                left: textPosition.x,
                height: "auto",
                width: "200px",
                color,
              }}
              onChange={(e) => {
                setEditText(e.target.value);
              }}
              ref={inputRef}
              value={editText}
              onKeyDown={(e) => {
                if (e.key === "Enter") onBlurTextField();
              }}
            />
          )}
        </Box>
      </Box>
    </Flex>
  );
});
