'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Divider,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShieldLock, IconUser, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminMode) {
      if (email.toLowerCase().includes('admin') || password.length >= 6) {
        notifications.show({
          title: 'Admin Session Authenticated',
          message: 'Elevated role privileges granted for moderation.',
          color: 'teal',
        });
        router.push('/admin');
      } else {
        notifications.show({
          title: 'Access Denied',
          message: 'Invalid administrative credentials.',
          color: 'red',
        });
      }
    } else {
      notifications.show({
        title: 'Commuter Sign-In',
        message: 'Signed in. Saved favorite journeys will now sync.',
        color: 'cyan',
      });
      router.push('/');
    }
  };

  return (
    <Container size="xs" py={80}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Link href="/">
            <Button size="xs" variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />}>
              Back to Public Commuter App
            </Button>
          </Link>
          <ThemeToggle />
        </Group>

        <Paper
          p="xl"
          radius="md"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {isAdminMode ? (
                  <IconShieldLock size={26} color="#ef4444" />
                ) : (
                  <IconUser size={26} color="#2dd4bf" />
                )}
                <Title order={3} style={{ color: 'var(--text-main)' }}>
                  {isAdminMode ? 'Transit Admin Login' : 'Commuter Account'}
                </Title>
              </Group>

              <Badge color={isAdminMode ? 'red' : 'teal'} variant="light">
                {isAdminMode ? 'Restricted' : 'Optional'}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed">
              {isAdminMode
                ? 'Authorized transit officials: moderate disruption reports and adjust network availability.'
                : 'Commuters can save routes across devices. (All planning features remain 100% accessible without logging in).'}
            </Text>

            <form onSubmit={handleLogin}>
              <Stack gap="sm">
                <TextInput
                  label="Email Address"
                  placeholder={isAdminMode ? 'admin@dhakapath.internal' : 'commuter@gmail.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  styles={{
                    input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
                  }}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  styles={{
                    input: { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-main)' },
                  }}
                />

                <Button
                  fullWidth
                  mt="md"
                  type="submit"
                  variant="gradient"
                  gradient={
                    isAdminMode
                      ? { from: 'orange', to: 'red' }
                      : { from: 'teal', to: 'cyan' }
                  }
                >
                  {isAdminMode ? 'Authorize as Admin' : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Divider my="xs" color="var(--border-subtle)" />

            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={() => setIsAdminMode(!isAdminMode)}
            >
              {isAdminMode
                ? 'Switch to Commuter Account'
                : 'Switch to Administrative Access Portal'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
