import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { togglePanel } from "../store/chatSlice";
import ChatPanel from "./ChatPanel";
import { Bot, X } from "lucide-react";

const STORAGE_KEY = "chatbot_button_position";
const BUTTON_SIZE = 48; // w-12 h-12
const MARGIN = 8;
const DRAG_THRESHOLD = 5; // px di chuyển tối thiểu để tính là kéo, không phải click

type Position = { x: number; y: number }; // top-left, tính từ góc trên-trái viewport

function clampPosition(pos: Position): Position {
  const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
  const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
  return {
    x: Math.min(Math.max(pos.x, MARGIN), Math.max(MARGIN, maxX)),
    y: Math.min(Math.max(pos.y, MARGIN), Math.max(MARGIN, maxY)),
  };
}

function loadInitialPosition(): Position {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return clampPosition(JSON.parse(raw));
  } catch { /* ignore */ }
  // Mặc định: góc dưới-phải, giống vị trí cũ (bottom-5 right-5)
  return clampPosition({
    x: window.innerWidth - BUTTON_SIZE - 20,
    y: window.innerHeight - BUTTON_SIZE - 20,
  });
}

export default function FloatingChatButton() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((state: RootState) => state.chat.isOpen);

  const [position, setPosition] = useState<Position>(loadInitialPosition);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, originX: 0, originY: 0 });

  // Giữ nút trong viewport khi resize cửa sổ
  useEffect(() => {
    const onResize = () => setPosition((p) => clampPosition(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== undefined && e.button !== 0) return; // chỉ chuột trái / touch
    draggingRef.current = true;
    movedRef.current = false;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    (e.target as HTMLButtonElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      movedRef.current = true;
    }
    if (movedRef.current) {
      setPosition(clampPosition({
        x: dragStartRef.current.originX + dx,
        y: dragStartRef.current.originY + dy,
      }));
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.target as HTMLButtonElement).releasePointerCapture(e.pointerId);

    if (movedRef.current) {
      // Vừa kéo xong: lưu vị trí, không coi là click mở panel
      setPosition((p) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
        return p;
      });
    } else {
      // Không di chuyển đáng kể → coi là click bình thường
      dispatch(togglePanel());
    }
  }, [dispatch]);

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ top: position.y, left: position.x, touchAction: "none" }}
        className={`fixed z-40 w-12 h-12 rounded-lg text-white shadow-lg flex items-center justify-center transition-colors duration-150 active:scale-95 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-orange-500 hover:bg-orange-600"
        }`}
        title="Trợ lý AI (kéo để di chuyển)"
        aria-label="Trợ lý AI"
      >
        {isOpen ? (
          <X className="w-5 h-5" strokeWidth={2.5} />
        ) : (
          <Bot className="w-5 h-5" />
        )}

        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </span>
        )}
      </button>

      <ChatPanel />
    </>
  );
}
