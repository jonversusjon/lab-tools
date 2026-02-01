import { createContext, useContext, useCallback, useRef, useEffect, useState } from "react";

const UndoContext = createContext(null);

const MAX_UNDO_STACK_SIZE = 50;

export function UndoProvider({ children }) {
  // Use ref for the stack to avoid re-renders on every push
  const undoStackRef = useRef([]);
  const subscribersRef = useRef(new Set());

  // Notify subscribers when stack changes
  const notifySubscribers = useCallback(() => {
    subscribersRef.current.forEach((callback) => callback());
  }, []);

  // Subscribe to stack changes (for components that need to know canUndo state)
  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  // Push a new state snapshot onto the undo stack
  const pushUndo = useCallback(
    (label, undoFn) => {
      undoStackRef.current.push({ label, undoFn, timestamp: Date.now() });

      // Limit stack size
      if (undoStackRef.current.length > MAX_UNDO_STACK_SIZE) {
        undoStackRef.current.shift();
      }

      notifySubscribers();
    },
    [notifySubscribers]
  );

  // Execute the most recent undo operation
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return false;

    const { undoFn, label } = undoStackRef.current.pop();
    console.log(`Undo: ${label}`);

    try {
      undoFn();
    } catch (error) {
      console.error("Undo operation failed:", error);
    }

    notifySubscribers();
    return true;
  }, [notifySubscribers]);

  // Check if undo is available
  const canUndo = useCallback(() => {
    return undoStackRef.current.length > 0;
  }, []);

  // Get the label of the next undo operation
  const getNextUndoLabel = useCallback(() => {
    if (undoStackRef.current.length === 0) return null;
    return undoStackRef.current[undoStackRef.current.length - 1].label;
  }, []);

  // Clear all undo history
  const clearUndoStack = useCallback(() => {
    undoStackRef.current = [];
    notifySubscribers();
  }, [notifySubscribers]);

  // Global keyboard listener for Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  const value = {
    pushUndo,
    undo,
    canUndo,
    getNextUndoLabel,
    clearUndoStack,
    subscribe,
  };

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
}

// Hook to use the undo context
export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within an UndoProvider");
  }
  return context;
}

// Hook to track canUndo state reactively
export function useCanUndo() {
  const { canUndo, subscribe } = useUndo();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return subscribe(() => forceUpdate({}));
  }, [subscribe]);

  return canUndo();
}

export default UndoContext;
