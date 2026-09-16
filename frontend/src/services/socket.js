import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

let socket;

// Single shared socket connection for the whole app - consultation rooms
// join/leave on it rather than opening a new connection per page.
export function getSocket() {
  if (!socket) {
    // socket.io-client treats undefined as "connect to the page's own
    // origin" - an empty-string API_ORIGIN (same-origin deployment) needs
    // to become undefined explicitly, since io('') is not equivalent.
    socket = io(API_ORIGIN || undefined, { autoConnect: true });
  }
  return socket;
}
