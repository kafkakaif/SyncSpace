import { useEffect, useRef, useState } from "react";
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import socket from "../services/socket";

const COLORS = ["#53C557", "#0E9488", "#23964B", "#111827", "#EF4444"];

function isValidPoint(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export default function WhiteboardCanvas({
  roomId,
  remoteCursors = [],
  onCursorMove,
  onError,
}) {
  const containerRef = useRef(null);
  const drawingRef = useRef(false);
  const cursorSendTimeRef = useRef(0);

  const [size, setSize] = useState({ width: 600, height: 400 });
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState("#53C557");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const resize = () => {
      setSize({
        width: Math.max(300, container.clientWidth),
        height: Math.max(250, container.clientHeight),
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // The room is server-driven state; clear stale canvas data before subscribing to a new room.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!roomId) {
      setItems([]);
      setDraft(null);
      drawingRef.current = false;
      return undefined;
    }

    setItems([]);
    setDraft(null);
    drawingRef.current = false;

    const onWhiteboardState = (data) => {
      if (data?.roomId !== roomId || !Array.isArray(data.items)) return;

      const validItems = data.items.filter((item) => {
        if (!item || typeof item.id !== "string") return false;
        if (!COLORS.includes(item.color)) {
          // Accept any server-validated six-digit hex color.
          if (typeof item.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(item.color)) {
            return false;
          }
        }

        if (item.type === "line") {
          return (
            Array.isArray(item.points) &&
            item.points.length >= 4 &&
            item.points.length % 2 === 0 &&
            item.points.every(isValidPoint)
          );
        }

        if (item.type === "rect") {
          return [item.x, item.y, item.width, item.height].every(isValidPoint);
        }

        if (item.type === "circle") {
          return [item.x, item.y, item.radius].every(isValidPoint) && item.radius >= 0;
        }

        if (item.type === "arrow") {
          return Array.isArray(item.points) && item.points.length === 4 && item.points.every(isValidPoint);
        }

        if (item.type === "diamond") {
          return [item.x, item.y, item.width, item.height].every(isValidPoint);
        }

        if (item.type === "sticky") {
          return isValidPoint(item.x) && isValidPoint(item.y) && typeof item.text === "string";
        }

        if (item.type === "text") {
          return (
            isValidPoint(item.x) &&
            isValidPoint(item.y) &&
            typeof item.text === "string"
          );
        }

        return false;
      });

      setItems(validItems);
    };

    const onObjectAdded = (data) => {
      if (data?.roomId !== roomId || !data.item?.id) return;

      setItems((previous) => {
        if (previous.some((item) => item.id === data.item.id)) {
          return previous;
        }

        return [...previous, data.item];
      });
    };

    const onObjectUpdated = (data) => {
      if (
        data?.roomId !== roomId ||
        typeof data.id !== "string" ||
        !data.position ||
        !isValidPoint(data.position.x) ||
        !isValidPoint(data.position.y)
      ) {
        return;
      }

      setItems((previous) =>
        previous.map((item) =>
          item.id === data.id
            ? { ...item, ...data.position }
            : item
        )
      );
    };

    const onWhiteboardClear = (clearedRoomId) => {
      if (clearedRoomId === roomId) {
        setItems([]);
        setDraft(null);
        drawingRef.current = false;
      }
    };

    socket.on("whiteboard:state", onWhiteboardState);
    socket.on("whiteboard:object:add", onObjectAdded);
    socket.on("whiteboard:object:update", onObjectUpdated);
    socket.on("whiteboard:clear", onWhiteboardClear);

    // Register listeners before asking for the latest in-memory room state.
    if (socket.connected) {
      socket.emit("whiteboard:state-request", roomId);
    }

    return () => {
      socket.off("whiteboard:state", onWhiteboardState);
      socket.off("whiteboard:object:add", onObjectAdded);
      socket.off("whiteboard:object:update", onObjectUpdated);
      socket.off("whiteboard:clear", onWhiteboardClear);
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [roomId]);

  const getPoint = (event) => event.target.getStage()?.getPointerPosition();

  const sendRemoteCursor = (event) => {
    if (!roomId || !socket.connected) return;

    const now = Date.now();
    if (now - cursorSendTimeRef.current < 50) return;
    cursorSendTimeRef.current = now;

    const point = getPoint(event);
    if (!point) return;

    onCursorMove?.({ x: point.x, y: point.y });
  };

  const addItem = (item) => {
    if (!roomId || !socket.connected) {
      onError?.("Join a room before editing the collaborative whiteboard.");
      return;
    }

    setItems((previous) => [...previous, item]);
    socket.emit("whiteboard:object:add", { roomId, item });
  };

  const handleMouseDown = (event) => {
    const stage = event.target.getStage();
    const point = getPoint(event);

    if (!stage || !point || event.target !== stage) return;

    if (!roomId || !socket.connected) {
      onError?.("Join a room before editing the collaborative whiteboard.");
      return;
    }

    if (tool === "draw") {
      drawingRef.current = true;
      setDraft({
        id: crypto.randomUUID(),
        type: "line",
        points: [point.x, point.y],
        color,
      });
    } else if (["rectangle", "diamond", "circle", "arrow"].includes(tool)) {
      drawingRef.current = true;
      const type = tool === "rectangle" ? "rect" : tool;
      setDraft({
        id: crypto.randomUUID(),
        type,
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        radius: 0,
        points: [point.x, point.y, point.x, point.y],
        color,
      });
    } else if (tool === "text") {
      const value = window.prompt("Enter your whiteboard text:");
      if (!value?.trim()) return;

      addItem({
        id: crypto.randomUUID(),
        type: "text",
        x: point.x,
        y: point.y,
        text: value.trim(),
        color,
      });
      setTool("select");
    } else if (tool === "sticky") {
      const value = window.prompt("Enter sticky note text:", "Idea");
      if (!value?.trim()) return;

      addItem({
        id: crypto.randomUUID(),
        type: "sticky",
        x: point.x,
        y: point.y,
        text: value.trim(),
        color,
      });
      setTool("select");
    }
  };

  const handleMouseMove = (event) => {
    sendRemoteCursor(event);

    if (!drawingRef.current || !draft) return;
    const point = getPoint(event);
    if (!point) return;

    if (draft.type === "line") {
      setDraft((previous) => ({
        ...previous,
        points: [...previous.points, point.x, point.y],
      }));
    } else if (draft.type === "rect" || draft.type === "diamond") {
      setDraft((previous) => ({
        ...previous,
        x: Math.min(previous.startX, point.x),
        y: Math.min(previous.startY, point.y),
        width: Math.abs(point.x - previous.startX),
        height: Math.abs(point.y - previous.startY),
      }));
    } else if (draft.type === "circle") {
      setDraft((previous) => ({
        ...previous,
        radius: Math.hypot(point.x - previous.startX, point.y - previous.startY),
      }));
    } else if (draft.type === "arrow") {
      setDraft((previous) => ({ ...previous, points: [previous.startX, previous.startY, point.x, point.y] }));
    }
  };

  const handleMouseUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (draft?.type === "line" && draft.points.length >= 4) {
      addItem(draft);
    }

    if (["rect", "diamond"].includes(draft?.type) && draft.width >= 3 && draft.height >= 3) {
      addItem({
        id: draft.id,
        type: draft.type,
        x: draft.x,
        y: draft.y,
        width: draft.width,
        height: draft.height,
        color: draft.color,
      });
    }

    if (draft?.type === "circle" && draft.radius >= 3) {
      addItem({ id: draft.id, type: "circle", x: draft.x, y: draft.y, radius: draft.radius, color: draft.color });
    }

    if (draft?.type === "arrow") {
      const [x1, y1, x2, y2] = draft.points;
      if (Math.hypot(x2 - x1, y2 - y1) >= 3) addItem({ id: draft.id, type: "arrow", points: draft.points, color: draft.color });
    }

    setDraft(null);
  };

  const updatePosition = (id, position) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, ...position } : item
      )
    );

    if (roomId && socket.connected) {
      socket.emit("whiteboard:object:update", {
        roomId,
        id,
        position,
      });
    }
  };
  
const broadcastDragPosition = (id, event) => {
  if (!roomId || !socket.connected) return;

  socket.emit("whiteboard:object:update", {
    roomId,
    id,
    position: {
      x: event.target.x(),
      y: event.target.y(),
    },
  });
};


  const clearBoard = () => {
    setItems([]);
    setDraft(null);
    drawingRef.current = false;

    if (roomId && socket.connected) {
      socket.emit("whiteboard:clear", roomId);
    }
  };

  const renderItem = (item) => {
    
    
    if (item.type === "line") {
      return (
        <Line
          key={item.id}
          points={item.points}
          stroke={item.color}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          tension={0.1}
        />
      );
    }

    if (item.type === "rect") {
      return (
        <Rect
        onDragMove={(event) =>
  broadcastDragPosition(item.id, event)
}
          key={item.id}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          stroke={item.color}
          strokeWidth={2}
          fill="rgba(83, 197, 87, 0.08)"
          draggable={tool === "select"}
          onDragEnd={(event) =>
            updatePosition(item.id, {
              x: event.target.x(),
              y: event.target.y(),
            })
          }
        />
      );
    }

    if (item.type === "circle") {
      return <Circle key={item.id} x={item.x} y={item.y} radius={item.radius} stroke={item.color} strokeWidth={2} fill="rgba(83, 197, 87, 0.08)" draggable={tool === "select"} onDragMove={(event) => broadcastDragPosition(item.id, event)} onDragEnd={(event) => updatePosition(item.id, { x: event.target.x(), y: event.target.y() })} />;
    }

    if (item.type === "arrow") {
      return <Arrow key={item.id} points={item.points} stroke={item.color} fill={item.color} strokeWidth={3} pointerLength={10} pointerWidth={10} />;
    }

    if (item.type === "diamond") {
      return <Line key={item.id} x={item.x} y={item.y} points={[item.width / 2, 0, item.width, item.height / 2, item.width / 2, item.height, 0, item.height / 2]} closed stroke={item.color} strokeWidth={2} fill="rgba(83, 197, 87, 0.08)" draggable={tool === "select"} onDragMove={(event) => broadcastDragPosition(item.id, event)} onDragEnd={(event) => updatePosition(item.id, { x: event.target.x(), y: event.target.y() })} />;
    }

    if (item.type === "sticky") {
      return <Group key={item.id} x={item.x} y={item.y} draggable={tool === "select"} onDragMove={(event) => broadcastDragPosition(item.id, event)} onDragEnd={(event) => updatePosition(item.id, { x: event.target.x(), y: event.target.y() })}><Rect width={160} height={100} fill="#fef08a" stroke={item.color} strokeWidth={2} cornerRadius={6} /><Text text={item.text} width={140} padding={10} fontSize={16} fill="#1f2937" /></Group>;
    }

    if (item.type === "text") {
      return (
        <Text
        onDragMove={(event) =>
  broadcastDragPosition(item.id, event)
}
          key={item.id}
          x={item.x}
          y={item.y}
          text={item.text}
          fontSize={18}
          fill={item.color}
          draggable={tool === "select"}
          onDragEnd={(event) =>
            updatePosition(item.id, {
              x: event.target.x(),
              y: event.target.y(),
            })
          }
        />
      );
    }

    return null;
  };

  return (
    <div className="konva-whiteboard">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          padding: 12,
        }}
      >
        {[
          ["select", "Select / Move"],
          ["draw", "Freehand"],
          ["rectangle", "Rectangle"],
          ["circle", "Circle"],
          ["arrow", "Arrow"],
          ["diamond", "Diamond"],
          ["text", "Text"],
          ["sticky", "Sticky Note"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTool(value)}
            aria-pressed={tool === value}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: tool === value ? "#dcfce7" : "#ffffff",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}

        {COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => setColor(swatch)}
            aria-label={`Choose color ${swatch}`}
            title={swatch}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: swatch,
              border:
                color === swatch
                  ? "3px solid #111827"
                  : "1px solid #d1d5db",
              cursor: "pointer",
            }}
          />
        ))}

        <button
          type="button"
          onClick={clearBoard}
          style={{ marginLeft: "auto", padding: "7px 10px", cursor: "pointer" }}
        >
          Clear
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: 400,
          overflow: "hidden",
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          touchAction: "none",
        }}
      >
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {items.map(renderItem)}
            {draft && renderItem(draft)}
          </Layer>
        </Stage>

        {remoteCursors.map((participant, index) => {
          const cursor = participant.cursor;
          if (!cursor) return null;
          const cursorColor = COLORS[index % COLORS.length];

          return (
            <div
              key={participant.socketId}
              style={{
                position: "absolute",
                left: cursor.x,
                top: cursor.y,
                zIndex: 10,
                pointerEvents: "none",
                transform: "translate(-2px, -2px)",
              }}
            >
              <svg
                width="18"
                height="22"
                viewBox="0 0 18 22"
                aria-hidden="true"
              >
                <path
                  d="M1 1 L1 17 L5.5 12.5 L9 20 L12 18.5 L9 11 L16 11 Z"
                  fill={cursorColor}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              </svg>
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 4,
                  padding: "3px 6px",
                  borderRadius: 4,
                  background: cursorColor,
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {participant.name}
              </span>
            </div>
          );
        })}
      </div>

      {!roomId && (
        <p style={{ padding: "8px 12px", margin: 0, color: "#6b7280" }}>
          Join a room to draw and collaborate.
        </p>
      )}
    </div>
  );
}
