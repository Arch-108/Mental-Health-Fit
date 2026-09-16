import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

let socket;

// Single shared socket connection for the whole app - consultation rooms
// join/leave on it rather than opening a new connection per page.
export function getSocket() {
  if (!socket) {
    socket = io(API_ORIGIN, { autoConnect: true });
  }
  return socket;
}
