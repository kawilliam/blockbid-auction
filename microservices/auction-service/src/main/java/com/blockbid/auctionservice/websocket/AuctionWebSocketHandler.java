package com.blockbid.auctionservice.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class AuctionWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(AuctionWebSocketHandler.class);

    // Map of itemId -> Set of WebSocket sessions
    private final Map<Long, CopyOnWriteArraySet<WebSocketSession>> itemSessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        logger.info("WebSocket connection established: {}", session.getId());
        session.sendMessage(new TextMessage("{\"type\":\"CONNECTION_ESTABLISHED\",\"message\":\"Connected to auction updates\"}"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            logger.info("Received message: {}", payload);

            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String type = (String) data.get("type");

            if ("SUBSCRIBE".equals(type)) {
                Long itemId = Long.valueOf(data.get("itemId").toString());
                subscribe(session, itemId);

                // Send confirmation
                Map<String, Object> response = Map.of(
                    "type", "SUBSCRIBED",
                    "itemId", itemId,
                    "message", "Subscribed to item " + itemId + " updates"
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            }

        } catch (Exception e) {
            logger.error("Error handling WebSocket message", e);
            sendError(session, "Error processing message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        logger.info("WebSocket connection closed: {} - Status: {}", session.getId(), status);

        // Remove session from all item subscriptions
        itemSessions.values().forEach(sessions -> sessions.remove(session));

        // Clean up empty sets
        itemSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("WebSocket transport error for session: {}", session.getId(), exception);
        session.close(CloseStatus.SERVER_ERROR);
    }

    /**
     * Subscribe a WebSocket session to updates for a specific item
     */
    private void subscribe(WebSocketSession session, Long itemId) {
        itemSessions.computeIfAbsent(itemId, k -> new CopyOnWriteArraySet<>()).add(session);
        logger.info("Session {} subscribed to item {}", session.getId(), itemId);
    }

    /**
     * Broadcast a new bid to all sessions subscribed to the item
     */
    public void broadcastNewBid(Long itemId, Map<String, Object> bidData) {
        CopyOnWriteArraySet<WebSocketSession> sessions = itemSessions.get(itemId);

        if (sessions == null || sessions.isEmpty()) {
            logger.debug("No active WebSocket sessions for item {}", itemId);
            return;
        }

        try {
            Map<String, Object> message = Map.of(
                "type", "NEW_BID",
                "data", bidData
            );

            String messageJson = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(messageJson);

            logger.info("Broadcasting new bid for item {} to {} sessions", itemId, sessions.size());

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        logger.error("Error sending message to session {}", session.getId(), e);
                        sessions.remove(session);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error broadcasting new bid", e);
        }
    }

    /**
     * Broadcast auction ended message
     */
    public void broadcastAuctionEnded(Long itemId, Map<String, Object> auctionData) {
        CopyOnWriteArraySet<WebSocketSession> sessions = itemSessions.get(itemId);

        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            Map<String, Object> message = Map.of(
                "type", "AUCTION_ENDED",
                "data", auctionData
            );

            String messageJson = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(messageJson);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        logger.error("Error sending auction ended message to session {}", session.getId(), e);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error broadcasting auction ended", e);
        }
    }

    /**
     * Send error message to a specific session
     */
    private void sendError(WebSocketSession session, String errorMessage) {
        try {
            Map<String, String> error = Map.of(
                "type", "ERROR",
                "message", errorMessage
            );
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(error)));
        } catch (IOException e) {
            logger.error("Error sending error message", e);
        }
    }
}