declare module "ws" {
  export type RawData = string | Buffer | ArrayBuffer | Buffer[];

  export default class WebSocket {
    static readonly OPEN: number;
    readonly readyState: number;

    constructor(url: string | URL, protocols?: string | string[]);

    on(event: "open", listener: () => void): this;
    on(event: "message", listener: (data: RawData) => void): this;
    on(event: "close", listener: (code: number, reason: Buffer) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    once(event: "close", listener: () => void): this;

    send(data: string): void;
    close(): void;
    terminate(): void;
  }
}
