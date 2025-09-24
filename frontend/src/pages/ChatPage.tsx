import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Menu, MessageCircle, Users } from "lucide-react";
import AppNavbar from "@/components/AppNavBar";
import { useProfile } from "@/hooks/use-profile";
import type { Role } from "@/schemas/user.schema";
import { useConversations, useHistory } from "@/hooks/use-chat";
import type { MessageInputForm } from "@/features/chat/schema";
import ConversationList from "@/features/chat/components/ConversationList";
import MessageInput from "@/features/chat/components/MessageInput";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { Skeleton } from "@/components/Skeleton";
import { useAppSocket } from "@/hooks/use-socket";
import { useRealtimeChat } from "@/hooks/use-chat-realtime";

export default function ChatPage() {
  const { otherPhone } = useParams<{ otherPhone: string }>();
  const navigate = useNavigate();
  const { currentUser } = useProfile();
  const threadRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [presence, setPresence] = useState<Record<string, boolean>>({});

  const myPhone = currentUser?.phoneNumber || "";
  const myRole: Role = (currentUser?.role as Role) || "student";
  const other = decodeURIComponent(otherPhone || "");

  const { socket } = useAppSocket({
    onPresence: (e) => {
      const key = e.phoneNumber || e.userId;
      if (!key) return;
      setPresence((m) => ({ ...m, [key]: e.online }));
    },
  });

  const { data: conversations = [], isLoading: loadingConvos } =
    useConversations(myPhone, myRole);

  const instructorPhone = myRole === "instructor" ? myPhone : other;
  const studentPhone = myRole === "student" ? myPhone : other;

  const { data: rawHistory = [], isLoading: loadingHistory } = useHistory(
    instructorPhone,
    studentPhone,
  );

  useEffect(() => {
    const a = document.body.style.overflow;
    const b = document.body.style.height;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    return () => {
      document.body.style.overflow = a;
      document.body.style.height = b;
    };
  }, []);

  const sidebarItems = useMemo(
    () =>
      conversations.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        lastMessage: c.lastMessage
          ? { ...c.lastMessage, createdAt: new Date(c.lastMessage.createdAt) }
          : null,
      })),
    [conversations],
  );

  const activeConversation = useMemo(() => {
    if (!other) return null;
    return (
      sidebarItems.find((c: any) => {
        const { instructor, student } = c.participants;
        return myRole === "instructor"
          ? student === other
          : instructor === other;
      }) || null
    );
  }, [sidebarItems, other, myRole]);

  const history = useMemo(
    () =>
      rawHistory.map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      })),
    [rawHistory],
  );

  useEffect(() => {
    if (!other && sidebarItems[0]) {
      const nextOther =
        myRole === "instructor"
          ? sidebarItems[0].participants.student
          : sidebarItems[0].participants.instructor;
      if (nextOther)
        navigate(`/chat/${encodeURIComponent(nextOther)}`, { replace: true });
    }
  }, [other, sidebarItems, myRole, navigate]);

  useEffect(() => {
    if (!activeConversation && sidebarItems.length) {
      setActiveId(sidebarItems[0].id);
    } else if (activeConversation) {
      setActiveId(activeConversation.id);
    }
  }, [activeConversation, sidebarItems]);

  useEffect(() => {
    setTimeout(
      () =>
        threadRef.current?.scrollTo({
          top: threadRef.current.scrollHeight,
          behavior: "smooth",
        }),
      50,
    );
  }, [history.length, other]);

  const { send } = useRealtimeChat({
    socket,
    myPhone,
    myRole,
    instructorPhone,
    studentPhone,
  });

  const handleSend = (data: MessageInputForm) => {
    if (!data.content.trim()) return;
    send(data.content);
  };

  const handleConversationSelect = (id: string) => {
    setActiveId(id);
    const conv = sidebarItems.find((x: any) => x.id === id);
    const nextOther =
      myRole === "instructor"
        ? conv?.participants.student
        : conv?.participants.instructor;
    if (nextOther) {
      navigate(`/chat/${encodeURIComponent(nextOther)}`);
      setIsSidebarOpen(false);
    }
  };

  const otherOnline = other ? !!presence[other] : false;

  return (
    <div className="fixed inset-0 flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
      <div className="z-10 flex-shrink-0">
        <AppNavbar
          userName={
            currentUser?.username ||
            (myRole === "instructor" ? "Instructor" : "Student")
          }
          onBellClick={() => {}}
          onProfile={() => {}}
          onSettings={() => {}}
          onLogout={() => {}}
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-80 transform flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:w-[320px] lg:translate-x-0 lg:border-r lg:border-gray-200 lg:shadow-none`}
          style={{
            top: "var(--navbar-height, 64px)",
            height: "calc(100vh - var(--navbar-height, 64px))",
          }}
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Messages
              </h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loadingConvos ? (
              <Skeleton rows={6} />
            ) : sidebarItems.length > 0 ? (
              <ConversationList
                items={sidebarItems}
                activeId={activeId}
                onSelect={handleConversationSelect}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white p-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="-ml-2 flex-shrink-0 rounded-md p-2 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold text-gray-900">
                  {other || "Select a conversation"}
                </h1>
                {activeConversation && (
                  <p className="flex items-center gap-2 truncate text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    {activeConversation.participants.instructor} ↔{" "}
                    {activeConversation.participants.student}
                    {other && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <span
                          className={`h-2 w-2 rounded-full ${otherOnline ? "bg-green-400" : "bg-gray-300"}`}
                        />
                        {otherOnline ? "Online" : "Offline"}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </header>

          <div
            ref={threadRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gray-50 p-4"
          >
            {loadingHistory ? (
              <div className="space-y-4">
                <Skeleton rows={5} />
              </div>
            ) : history.length > 0 ? (
              history.map((m: any) => (
                <MessageBubble key={m.id} msg={m} meRole={myRole} />
              ))
            ) : other ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 text-6xl">👋</div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Start a conversation
                </h3>
                <p className="max-w-sm text-gray-500">
                  Send a message to begin your conversation with {other}
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Welcome to Messages
                </h3>
                <p className="max-w-sm text-gray-500">
                  Select a conversation from the sidebar to start chatting
                </p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <MessageInput disabled={!other} onSubmit={handleSend} />
          </div>
        </main>
      </div>
    </div>
  );
}
