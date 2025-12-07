import { useEffect, useCallback, useState } from 'react';
import { websocket } from '../services/api';

/**
 * Custom hook for WebSocket event handling
 * @param {string} event - The event name to listen for
 * @param {Function} handler - The callback function to handle the event
 */
export const useWebSocket = (event, handler) => {
  useEffect(() => {
    if (!event || !handler) return;

    websocket.on(event, handler);

    return () => {
      websocket.off(event, handler);
    };
  }, [event, handler]);
};

/**
 * Hook for emitting WebSocket events
 * @returns {Function} emit - Function to emit events
 */
export const useWebSocketEmit = () => {
  const emit = useCallback((event, data) => {
    websocket.emit(event, data);
  }, []);

  return emit;
};

/**
 * Hook for managing WebSocket connection status
 * @returns {Object} - { connected, connecting }
 */
export const useWebSocketStatus = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setConnecting(false);
    };

    const handleDisconnect = () => {
      setConnected(false);
      setConnecting(false);
    };

    const handleConnecting = () => {
      setConnecting(true);
    };

    websocket.on('connect', handleConnect);
    websocket.on('disconnect', handleDisconnect);
    websocket.on('connecting', handleConnecting);

    // Check initial state
    const socket = websocket.getSocket();
    if (socket) {
      setConnected(socket.connected);
    }

    return () => {
      websocket.off('connect', handleConnect);
      websocket.off('disconnect', handleDisconnect);
      websocket.off('connecting', handleConnecting);
    };
  }, []);

  return { connected, connecting };
};

export default useWebSocket;
