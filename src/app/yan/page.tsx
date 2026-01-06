import { Chat } from "@/components/yan/chat/chat"
import { YanProvider } from "@/lib/chat-store/provider"

export default async function Page() {
  return (
    <YanProvider>
      <Chat />
    </YanProvider>
  )
}
