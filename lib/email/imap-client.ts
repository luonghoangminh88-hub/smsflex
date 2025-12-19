import Imap from "imap"
import { simpleParser } from "mailparser"

export interface EmailConfig {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
  authTimeout?: number
  connTimeout?: number
}

export interface ParsedEmail {
  subject: string
  from: string
  date: Date
  html?: string
  text?: string
}

export class ImapClient {
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
  }

  private buildFromSearchCriteria(fromAddresses: string[]): any[] {
    if (fromAddresses.length === 0) {
      return ["UNSEEN"]
    }

    if (fromAddresses.length === 1) {
      return ["UNSEEN", ["FROM", fromAddresses[0]]]
    }

    // Build nested OR structure for multiple addresses
    // IMAP OR takes exactly 2 arguments, so we need to nest them
    // For [A, B, C] we build: OR (FROM A) (OR (FROM B) (FROM C))
    let orCriteria: any = ["FROM", fromAddresses[fromAddresses.length - 1]]

    for (let i = fromAddresses.length - 2; i >= 0; i--) {
      orCriteria = ["OR", ["FROM", fromAddresses[i]], orCriteria]
    }

    return ["UNSEEN", orCriteria]
  }

  async fetchUnseenEmails(fromAddresses: string[]): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2", // More secure TLS version
        },
        authTimeout: this.config.authTimeout || 10000, // 10 seconds auth timeout
        connTimeout: this.config.connTimeout || 10000, // 10 seconds connection timeout
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true,
        },
      })

      const emails: ParsedEmail[] = []
      let pendingParsing = 0
      let fetchComplete = false

      const checkComplete = () => {
        if (fetchComplete && pendingParsing === 0) {
          console.log(`[v0] Successfully fetched ${emails.length} emails`)
          imap.end()
          resolve(emails)
        }
      }

      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err) => {
          if (err) {
            imap.end()
            return reject(err)
          }

          const searchCriteria = this.buildFromSearchCriteria(fromAddresses)

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              imap.end()
              return reject(err)
            }

            if (!results || results.length === 0) {
              console.log("[v0] No unseen emails found")
              imap.end()
              return resolve([])
            }

            const limitedResults = results.slice(-20)
            console.log(`[v0] Found ${results.length} emails, processing latest ${limitedResults.length}`)

            const fetch = imap.fetch(limitedResults, { bodies: "" })

            fetch.on("message", (msg) => {
              pendingParsing++

              msg.on("body", (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error("[v0] Error parsing email:", err)
                    pendingParsing--
                    checkComplete()
                    return
                  }

                  emails.push({
                    subject: parsed.subject || "",
                    from: parsed.from?.text || "",
                    date: parsed.date || new Date(),
                    html: parsed.html || undefined,
                    text: parsed.text || undefined,
                  })

                  console.log(`[v0] Parsed email from: ${parsed.from?.text}, subject: ${parsed.subject}`)

                  pendingParsing--
                  checkComplete()
                })
              })

              msg.once("attributes", (attrs) => {
                const { uid } = attrs
              })
            })

            fetch.once("error", (err) => {
              console.error("[v0] Fetch error:", err)
              imap.end()
              reject(err)
            })

            fetch.once("end", () => {
              fetchComplete = true
              checkComplete()
            })
          })
        })
      })

      imap.once("error", (err) => {
        console.error("[v0] IMAP error:", err)
        if (err.source === "authentication") {
          console.error("[v0] Authentication failed. Please check:")
          console.error("  1. EMAIL_USER and EMAIL_PASSWORD are correctly set")
          console.error("  2. For Gmail: Enable 'Less secure app access' or use App Password")
          console.error("  3. For other providers: Check IMAP settings and credentials")
        }
        reject(err)
      })

      const connectionTimeout = setTimeout(() => {
        console.error("[v0] IMAP connection timeout")
        imap.end()
        reject(new Error("Connection timeout"))
      }, 30000) // 30 seconds total timeout

      imap.once("ready", () => {
        clearTimeout(connectionTimeout)
      })

      try {
        imap.connect()
      } catch (error) {
        clearTimeout(connectionTimeout)
        console.error("[v0] Failed to connect to IMAP:", error)
        reject(error)
      }
    })
  }
}
