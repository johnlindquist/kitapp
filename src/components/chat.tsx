import { useAtom, useSetAtom } from 'jotai';
import React, { ReactNode, useEffect } from 'react';
import { MessageList, Input, Button, MessageType } from 'react-chat-elements';
import { chatMessagesAtom, chatMessageSubmitAtom } from '../jotai';

export function Chat() {
  // Ref for the input
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Create currentMessage state
  const [currentMessage, setCurrentMessage] = React.useState('');

  // Create messages state array
  const [messages, setMessages] = useAtom(chatMessagesAtom);

  const submitMessage = useSetAtom(chatMessageSubmitAtom);

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Create onSubmit handler
  const onSubmit = (e: any) => {
    e.preventDefault();
    setMessages([
      ...messages,
      {
        position: 'right',
        type: 'text',
        text: currentMessage,
      },
    ]);
    submitMessage(currentMessage);
    setCurrentMessage('');
    e.currentTarget.value = '';
  };

  // Create onKeyDown handler
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // return if any modifier keys are pressed
    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }
    // Check if the user pressed the Enter key
    if (e.key === 'Enter') {
      onSubmit(e as any);
    }

    // log the current value of the input
  };

  // when messages changes, scroll to the bottom
  useEffect(() => {
    const element = document.querySelector('.kit-chat-messages > .rce-mlist');

    if (element) {
      // smooth scroll to the bottom
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Cast MessageList to ReactNode */}
      <MessageList
        dataSource={messages}
        className="kit-chat-messages"
        toBottomHeight="100%"
        notchStyle={{ display: 'none' }}
      />
      <Input
        referance={inputRef}
        className="kit-chat-input"
        inputStyle={{ fontSize: '1rem' }}
        placeholder="Type here..."
        rightButtons={
          <Button
            className="kit-chat-submit"
            backgroundColor=""
            color=""
            text="⏎"
            onClick={onSubmit}
          />
        }
        onKeyDown={onKeyDown}
        onChange={(e: any) => setCurrentMessage(e.target.value)}
      />
    </div>
  );
}
