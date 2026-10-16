'use client';

import React from 'react';
import { Group, Title, Badge, Button, Box, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconCompass,
  IconAlertTriangle,
  IconMessageChatbot,
  IconShieldLock,
  IconRoute,
  IconBus,
} from '@tabler/icons-react';

import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: 'planner' | 'alerts' | 'network' | 'admin';
  setActiveTab: (tab: 'planner' | 'alerts' | 'network' | 'admin') => void;
  activeAlertsCount: number;
  onOpenChat: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  activeAlertsCount,
  onOpenChat,
}: NavbarProps) {
  return (
    <Box
      component="header"
      px="md"
      py="xs"
      style={{
        borderBottom: '1px solid var(--nav-border)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Group justify="space-between">
        <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('planner')}>
          <Box
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(45, 212, 191, 0.35)',
            }}
          >
            <IconCompass size={20} color="#0a0f18" stroke={2.5} />
          </Box>
          <Box>
            <Group gap={6} align="center">
              <Title order={3} style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                DhakaPath
              </Title>
              <Badge size="xs" variant="gradient" gradient={{ from: 'teal', to: 'cyan' }}>
                Pilot
              </Badge>
            </Group>
          </Box>
        </Group>

        {/* Navigation Tabs */}
        <Group gap="xs" visibleFrom="sm">
          <Button
            size="xs"
            variant={activeTab === 'planner' ? 'filled' : 'subtle'}
            color="teal"
            leftSection={<IconRoute size={15} />}
            onClick={() => setActiveTab('planner')}
          >
            Trip Planner
          </Button>

          <Button
            size="xs"
            variant={activeTab === 'network' ? 'filled' : 'subtle'}
            color="cyan"
            leftSection={<IconBus size={15} />}
            onClick={() => setActiveTab('network')}
          >
            Transit Network
          </Button>

          <Button
            size="xs"
            variant={activeTab === 'alerts' ? 'filled' : 'subtle'}
            color="orange"
            leftSection={<IconAlertTriangle size={15} />}
            rightSection={
              activeAlertsCount > 0 ? (
                <Badge size="xs" color="red" variant="filled">
                  {activeAlertsCount}
                </Badge>
              ) : null
            }
            onClick={() => setActiveTab('alerts')}
          >
            Street Alerts
          </Button>

          <Button
            size="xs"
            variant={activeTab === 'admin' ? 'filled' : 'subtle'}
            color="gray"
            leftSection={<IconShieldLock size={15} />}
            onClick={() => setActiveTab('admin')}
          >
            Admin CMS
          </Button>
        </Group>

        {/* Action Controls */}
        <Group gap="xs">
          <ThemeToggle />

          <Button
            size="xs"
            variant="gradient"
            gradient={{ from: 'cyan', to: 'teal' }}
            leftSection={<IconMessageChatbot size={16} />}
            onClick={onOpenChat}
          >
            AI Assistant
          </Button>

          <Box hiddenFrom="sm">
            <Tooltip label="Street Alerts">
              <ActionIcon
                variant={activeTab === 'alerts' ? 'filled' : 'subtle'}
                color="orange"
                onClick={() => setActiveTab('alerts')}
              >
                <IconAlertTriangle size={18} />
              </ActionIcon>
            </Tooltip>
          </Box>
        </Group>
      </Group>
    </Box>
  );
}
