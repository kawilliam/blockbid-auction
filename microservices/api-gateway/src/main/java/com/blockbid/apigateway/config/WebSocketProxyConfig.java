package com.blockbid.apigateway.config;

import com.blockbid.apigateway.websocket.WebSocketProxyHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketProxyConfig implements WebSocketConfigurer {

    private final WebSocketProxyHandler webSocketProxyHandler;

    public WebSocketProxyConfig(WebSocketProxyHandler webSocketProxyHandler) {
        this.webSocketProxyHandler = webSocketProxyHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Proxy WebSocket connections to auction-service
        registry.addHandler(webSocketProxyHandler, "/ws/auction/**")
                .setAllowedOrigins("*");  // In production, specify actual origins
    }
}