declare module "imap" {
  import { EventEmitter } from "events"

  interface ImapConfig {
    user: string
    password: string
    host: string
    port: number
    tls: boolean
    tlsOptions?: {
      rejectUnauthorized?: boolean
    }
    authTimeout?: number
    connTimeout?: number
  }

  interface Box {
    name: string
    flags: string[]
    readOnly: boolean
    uidvalidity: number
    uidnext: number
    permFlags: string[]
    keywords: string[]
    newKeywords: boolean
    persistentUIDs: boolean
    messages: {
      total: number
      new: number
    }
  }

  interface ImapFetch extends EventEmitter {
    on(event: "message", listener: (msg: ImapMessage, seqno: number) => void): this
    on(event: "error", listener: (err: Error) => void): this
    on(event: "end", listener: () => void): this
    once(event: "message", listener: (msg: ImapMessage, seqno: number) => void): this
    once(event: "error", listener: (err: Error) => void): this
    once(event: "end", listener: () => void): this
  }

  interface ImapMessage extends EventEmitter {
    on(event: "body", listener: (stream: NodeJS.ReadableStream, info: any) => void): this
    on(event: "attributes", listener: (attrs: any) => void): this
    once(event: "body", listener: (stream: NodeJS.ReadableStream, info: any) => void): this
    once(event: "attributes", listener: (attrs: any) => void): this
  }

  class Connection extends EventEmitter {
    constructor(config: ImapConfig)

    once(event: "ready", listener: () => void): this
    once(event: "error", listener: (err: Error) => void): this
    once(event: "end", listener: () => void): this

    connect(): void
    end(): void
    openBox(mailboxName: string, readOnly: boolean, callback: (err: Error | null, box?: Box) => void): void
    search(criteria: any[], callback: (err: Error | null, results: number[]) => void): void
    fetch(source: number[], options: any): ImapFetch
    addFlags(source: number | number[], flags: string | string[], callback: (err: Error | null) => void): void
  }

  export = Connection
}

declare module "mailparser" {
  import type { Readable } from "stream"

  export interface ParsedMail {
    subject?: string
    from?: {
      text: string
      value: Array<{
        address: string
        name: string
      }>
    }
    to?: {
      text: string
      value: Array<{
        address: string
        name: string
      }>
    }
    date?: Date
    text?: string
    html?: string
    headers?: Map<string, string>
    attachments?: Array<{
      filename: string
      contentType: string
      size: number
      content: Buffer
    }>
  }

  export function simpleParser(
    source: string | Buffer | Readable,
    callback?: (err: Error | null, parsed: ParsedMail) => void,
  ): Promise<ParsedMail>
}
