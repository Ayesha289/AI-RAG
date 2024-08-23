'use client';
import { Box, Button, Stack, TextField, Paper, Typography } from '@mui/material';
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundImage: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        backgroundSize: 'cover',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: '#333',
          mb: 2,
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #6A5ACD, #9370DB)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        AI Assistant to Rate Your Professor
      </Typography>

      <Paper
        elevation={6}
        sx={{
          width: '550px',
          height: '500px',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          backgroundColor: '#ffffffee',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          p={2}
          sx={{ scrollbarWidth: 'thin' }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                sx={{
                  bgcolor:
                    message.role === 'assistant'
                      ? 'primary.light'
                      : 'secondary.light',
                  color: 'white',
                  borderRadius: 2,
                  p: 2,
                  maxWidth: '70%',
                  boxShadow: 1,
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={2} p={2}>
          <TextField
            label="Type a message..."
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#4A90E2',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#357ABD',
              },
              boxShadow: '0px 4px 20px rgba(0, 123, 255, 0.2)',
            }}
            onClick={sendMessage}
          >
            Send
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
