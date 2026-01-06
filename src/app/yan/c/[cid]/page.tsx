import { Chat } from "@/components/yan/chat/chat"
import { Header } from "@/components/yan/layout/header"
import { YanProvider } from "@/lib/chat-store/provider"

export default async function Page() {
  return (
    <YanProvider>
      <Chat />
    </YanProvider>
  )
}
