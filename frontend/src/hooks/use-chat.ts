import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHistory,
  listConversations,
  sendMessage,
} from "@/features/chat/utils/api";
import { conversationsKeys } from "@/features/instructors/constants/query-keys";
import { toast } from "sonner";
import type { Role } from "@/schemas/user.schema";
import type {
  ListConversationsDTO,
  SendMessageDTO,
} from "@/features/chat/schema";

export function useConversations(userPhone: string, role: Role) {
  return useQuery({
    queryKey: conversationsKeys.allConversations(userPhone, role),
    queryFn: (): Promise<{ items: any[] }> =>
      listConversations({
        userPhone,
        role,
        limit: 20,
      } as ListConversationsDTO),
    select: (row) => row.items,
  });
}

export function useHistory(instructorPhone?: string, studentPhone?: string) {
  return useQuery({
    queryKey: conversationsKeys.history(instructorPhone, studentPhone),
    queryFn: () =>
      getHistory({
        instructorPhone: instructorPhone!,
        studentPhone: studentPhone!,
        limit: 20,
      }),
    select: (row) => row.items,
    enabled: Boolean(instructorPhone && studentPhone),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessageDTO) => sendMessage(payload),
    onSuccess: (_saved, variables) => {
      const { instructorPhone, studentPhone } = variables;

      queryClient.invalidateQueries({
        queryKey: conversationsKeys.history(instructorPhone, studentPhone),
      });
      queryClient.invalidateQueries({
        queryKey: conversationsKeys.allConversations(
          instructorPhone,
          _saved.senderRole,
        ),
      });

      toast.success("Message sent.");
    },
    onError: () => {
      toast.error("Failed to send message.");
    },
  });
}
