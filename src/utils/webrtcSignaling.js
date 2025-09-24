// Minimal stubs for WebRTC signaling. Replace with real implementation as needed.

/**
 * Join a signaling channel and listen for messages.
 * @param {string} channelId - The signaling channel ID.
 * @param {function} onMessage - Callback for incoming messages.
 */
export function joinSignalingChannel(channelId, onMessage) {
  // TODO: Implement real signaling logic (e.g., WebSocket, Supabase Realtime, etc.)
  console.log(`[Stub] joinSignalingChannel called for channel: ${channelId}`);
  // Example: You might want to store the callback for later use
}

/**
 * Send a signaling message to the channel.
 * @param {string} channelId - The signaling channel ID.
 * @param {object} message - The message to send.
 */
export function sendSignal(channelId, message) {
  // TODO: Implement real signaling logic
  console.log(`[Stub] sendSignal called for channel: ${channelId}`, message);
}

/**
 * Leave the signaling channel.
 */
export function leaveSignalingChannel() {
  // TODO: Implement real signaling logic
  console.log('[Stub] leaveSignalingChannel called');
}
