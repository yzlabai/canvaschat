"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Calendar, 
  Globe, 
  CreditCard, 
  MessageSquare,
  MapPin,
  Wallet
} from "lucide-react";
import { UserListItem, fetchUserDetails } from "@/services/admin-client";

interface UserDetailsModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserDetails = async (userId: number) => {
    setIsLoading(true);
    try {
      const details = await fetchUserDetails(userId);
      setUserDetails(details);
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setUserDetails(null);
    } else if (user) {
      loadUserDetails(user.id);
    }
  };

  if (!user) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            Complete information about {user.nickname || user.email}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url || ''} alt={user.nickname || user.email} />
                  <AvatarFallback className="text-lg">
                    {(user.nickname || user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {user.nickname || 'No display name'}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                      {user.status}
                    </Badge>
                    <Badge variant="outline">
                      {user.signin_provider || 'email'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>ID: {user.uuid}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {formatDate(user.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Locale: {user.locale || 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>IP: {user.signin_ip || 'Not recorded'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{user.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">${user.total_spent.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{user.total_conversations}</p>
                    <p className="text-xs text-muted-foreground">Conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Tabs */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userDetails && (
            <Tabs defaultValue="conversations" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="credits">Credits</TabsTrigger>
              </TabsList>

              <TabsContent value="conversations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetails.conversations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No conversations found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userDetails.conversations.map((conversation: any) => (
                          <div key={conversation.id} className="p-3 border rounded">
                            <p className="font-medium">
                              {conversation.title || 'Untitled Conversation'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {conversation.total_messages} messages • 
                              {formatDate(conversation.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Credit History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetails.credits.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No credit transactions found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userDetails.credits.map((credit: any) => (
                          <div key={credit.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{credit.trans_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(credit.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${credit.credits > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {credit.credits > 0 ? '+' : ''}{credit.credits}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  variant = 'default'
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={variant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}