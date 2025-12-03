package com.blockbid.apigateway.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketProxyHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketProxyHandler.class);
    private static final String AUCTION_SERVICE_WS_URL = "ws://auction-service:8083";

    // Map client sessions to backend sessions
    private final Map<WebSocketSession, WebSocketSession> sessionMap = new ConcurrentHashMap<>();
    private final StandardWebSocketClient webSocketClient = new StandardWebSocketClient();

    @Override
    public void afterConnectionEstablished(WebSocketSession clientSession) throws Exception {
        logger.info("Client connected: {}", clientSession.getId());

        try {
            // Extract itemId from the path
            String path = clientSession.getUri().getPath();
            String itemId = extractItemId(path);

            if (itemId == null) {
                logger.error("No itemId found in path: {}", path);
                clientSession.close(CloseStatus.BAD_DATA);
                return;
            }

            // Build backend WebSocket URL
            String backendUrl = AUCTION_SERVICE_WS_URL + "/ws/auction/" + itemId;
            logger.info("Connecting to backend: {}", backendUrl);

            // Connect to auction-service WebSocket
            WebSocketSession backendSession = webSocketClient.execute(
                new BackendWebSocketHandler(clientSession),
                backendUrl
            ).get();

            // Store the mapping
            sessionMap.put(clientSession, backendSession);

            logger.info("Proxy established: client={} <-> backend={}",
                       clientSession.getId(), backendSession.getId());

        } catch (Exception e) {
            logger.error("Error establishing WebSocket proxy", e);
            clientSession.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession clientSession, TextMessage message) throws Exception {
        // Forward messages from client to backend
        WebSocketSession backendSession = sessionMap.get(clientSession);

        if (backendSession != null && backendSession.isOpen()) {
            logger.debug("Forwarding message from client to backend: {}", message.getPayload());
            backendSession.sendMessage(message);
        } else {
            logger.warn("No backend session found for client: {}", clientSession.getId());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession clientSession, CloseStatus status) throws Exception {
        logger.info("Client disconnected: {} - Status: {}", clientSession.getId(), status);

        // Close backend session
        WebSocketSession backendSession = sessionMap.remove(clientSession);
        if (backendSession != null && backendSession.isOpen()) {
            backendSession.close(status);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("WebSocket transport error for session: {}", session.getId(), exception);

        // Clean up
        WebSocketSession backendSession = sessionMap.remove(session);
        if (backendSession != null && backendSession.isOpen()) {
            backendSession.close(CloseStatus.SERVER_ERROR);
        }

        session.close(CloseStatus.SERVER_ERROR);
    }

    /**
     * Extract itemId from WebSocket path like "/ws/auction/123"
     */
    private String extractItemId(String path) {
        String[] parts = path.split("/");
        if (parts.length >= 4) {
            return parts[3];  // /ws/auction/{itemId}
        }
        return null;
    }

    /**
     * Handler for backend WebSocket connection (auction-service)
     */
    private class BackendWebSocketHandler extends TextWebSocketHandler {

        private final WebSocketSession clientSession;

        public BackendWebSocketHandler(WebSocketSession clientSession) {
            this.clientSession = clientSession;
        }

        @Override
        protected void handleTextMessage(WebSocketSession backendSession, TextMessage message) throws Exception {
            // Forward messages from backend to client
            if (clientSession.isOpen()) {
                logger.debug("Forwarding message from backend to client: {}", message.getPayload());
                clientSession.sendMessage(message);
            }
        }

        @Override
        public void afterConnectionClosed(WebSocketSession backendSession, CloseStatus status) throws Exception {
            logger.info("Backend connection closed: {}", status);

            // Close client session
            if (clientSession.isOpen()) {
                clientSession.close(status);
            }

            sessionMap.remove(clientSession);
        }

        @Override
        public void handleTransportError(WebSocketSession backendSession, Throwable exception) throws Exception {
            logger.error("Backend WebSocket transport error", exception);

            // Close client session
            if (clientSession.isOpen()) {
                clientSession.close(CloseStatus.SERVER_ERROR);
            }

            sessionMap.remove(clientSession);
        }
    }
}