import { McpToolRequest, McpToolResponse } from './types';

export interface ConnectorRegistryConfig {
  allowedServers: string[];
  mcpEndpoints?: Record<string, string>;
}

export class McpBridgeConnector {
  private allowedServers: Set<string>;
  private customHandlers: Map<string, (toolName: string, args: Record<string, unknown>) => Promise<unknown>> = new Map();

  constructor(config?: ConnectorRegistryConfig) {
    this.allowedServers = new Set(config?.allowedServers || ['local-crm', 'erp-inventory', 'browser-automation']);
  }

  public registerServerHandler(server: string, handler: (toolName: string, args: Record<string, unknown>) => Promise<unknown>): void {
    this.allowedServers.add(server);
    this.customHandlers.set(server, handler);
  }

  public async callMcpTool(request: McpToolRequest): Promise<McpToolResponse> {
    if (!this.allowedServers.has(request.server)) {
      return {
        success: false,
        content: null,
        error: `Permission Denied: Server '${request.server}' is not authorized in connector registry.`,
      };
    }

    // Check if custom handler registered
    const handler = this.customHandlers.get(request.server);
    if (handler) {
      try {
        const result = await handler(request.toolName, request.arguments);
        return { success: true, content: result };
      } catch (err) {
        return { success: false, content: null, error: (err as Error).message };
      }
    }

    // Built-in standard mock/bridge handling
    if (request.server === 'erp-inventory') {
      if (request.toolName === 'check_stock') {
        const sku = String(request.arguments.sku || '');
        return {
          success: true,
          content: { sku, inStock: true, unitsAvailable: 42, warehouse: 'Main Depot' },
        };
      }
    }

    if (request.server === 'browser-automation') {
      if (request.toolName === 'scrape_competitor_price') {
        return {
          success: true,
          content: { product: request.arguments.product, marketAveragePrice: 1299, sampleTimestamp: new Date().toISOString() },
        };
      }
    }

    return {
      success: false,
      content: null,
      error: `Tool '${request.toolName}' not found on server '${request.server}'.`,
    };
  }
}
