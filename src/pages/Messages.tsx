import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useMessages';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Messages() {
  const { user } = useAuth();
  const { data: conversations = [] } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const { data: messages = [] } = useMessages(selectedConversation);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    const recipientId = conversation?.participants.find(p => p !== user?.uid) || '';

    await sendMessage.mutateAsync({
      conversationId: selectedConversation,
      content: newMessage,
      recipientId,
    });

    setNewMessage('');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Mensajes</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay conversaciones
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <Card
                        key={conv.id}
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          selectedConversation === conv.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {conv.participants[0]?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                Conversación
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.last_message}
                              </p>
                            </div>
                            {conv.unread_count > 0 && (
                              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {conv.unread_count}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedConversation ? (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  Selecciona una conversación
                </div>
              ) : (
                <div className="space-y-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender_id === user?.uid
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
