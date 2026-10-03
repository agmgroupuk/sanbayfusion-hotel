
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import HelpPanel from './components/HelpPanel';
import ChatBox from './components/ChatBox';
import NavigationDrawer from './components/NavigationDrawer';
import ToastContainer, { toast } from './components/Toast';
import FilePanel from './components/FilePanel';
import Overlay from './components/Overlay';
import Footer from './components/Footer';
// Fix: Import WorkspaceMode which was missing and causing a reference error on line 312
import { ChatSession, Message, SettingsState, NavItem, CanvasState, WorkspaceMode } from './types';
import { DEFAULT_SETTINGS, NEURAL_PRESETS } from './constants';
import { sendMessage, sendMessageStream, formatConversationHistory, ImageData, extractDocumentText, FileOperation, AgentUIEvent } from './services/chatService';
import { sessionApiService } from './services/sessionApiService';
import * as sessionClient from '../../lib/session-client';

interface AppProps {
  initialAgentId?: string;
  initialAgentName?: string;
  initialSystemPrompt?: string;
  initialProvider?: string;
  initialModel?: string;
  agentIcon?: string;
  agentSpecialty?: string;
  agentColor?: string;
  agentCategory?: string;
  agentFallbacks?: string[];
}

// Sanitize error messages for user display — hide technical details
const sanitizeErrorMessage = (error: any): string => {
  const message = error?.message || error?.toString() || '';
  
  // Hide OpenAI/provider-specific schema errors
  if (message.includes('Invalid schema') || message.includes('function.parameters')) {
    return 'Something went wrong with the AI request. Please try again.';
  }
  
  // Hide provider names and API details
  if (message.includes('openai') || message.includes('mistral') || message.includes('anthropic') || message.includes('xai')) {
    return 'AI service temporarily unavailable. Please try again.';
  }
  
  // Hide rate limit details
  if (message.includes('rate limit') || message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Hide authentication errors
  if (message.includes('401') || message.includes('unauthorized') || message.includes('api key')) {
    return 'Service authentication issue. Please try again later.';
  }
  
  // Hide server errors
  if (message.includes('500') || message.includes('503') || message.includes('internal server')) {
    return 'Our servers are busy. Please try again in a moment.';
  }
  
  // Hide timeout errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return 'Request timed out. Please try again.';
  }
  
  // Default fallback for any other technical errors
  if (message.includes('error') && message.length > 100) {
    return 'Something went wrong. Please try again.';
  }
  
  return message || 'Failed to get response. Please try again.';
};

const App: React.FC<AppProps> = ({
  initialAgentId = '',
  initialAgentName = 'AI Assistant',
  initialSystemPrompt,
  initialProvider,
  initialModel,
  agentIcon = '🤖',
  agentSpecialty = '',
  agentColor = 'from-emerald-400 to-cyan-500',
  agentCategory = '',
  agentFallbacks = []
}) => {
  // UI State
  const [isOverlayActive, setIsOverlayActive] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  const [isFilePanelOpen, setIsFilePanelOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecordingSTT, setIsRecordingSTT] = useState(false);
  const [voiceText, setVoiceText] = useState(''); // Voice transcript to pass to ChatBox

  // Virtual filesystem state — files created/modified by AI agent
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // STT refs
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Provider credentials remain server-side; users can change provider and model in settings.
  const resolvedProvider = initialProvider || 'openai';
  const resolvedModel = initialModel || 'gpt-4o-mini';
  const initialSettings: SettingsState = {
    ...DEFAULT_SETTINGS,
    agentId: initialAgentId,
    agentName: initialAgentName,
    customPrompt: initialSystemPrompt || DEFAULT_SETTINGS.customPrompt,
    provider: resolvedProvider,
    model: resolvedModel
  };

  // Default session for SSR and first load
  // Use static timestamp to avoid hydration mismatch
  const defaultSessions: ChatSession[] = [
    {
      id: 'pending',
      name: "New Chat",
      active: true,
      messages: [
        {
          id: 'init-1',
          sender: 'AGENT',
          text: 'Hello! I\'m ready to help you. Feel free to ask me anything, upload images, or request me to generate images for you.',
          timestamp: '--:--:-- --'  // Static for SSR, will be updated on client
        }
      ],
      settings: initialSettings
    }
  ];

  // App Data State - SSR safe
  const [sessions, setSessions] = useState<ChatSession[]>(defaultSessions);
  const [sessionsReady, setSessionsReady] = useState(true);

  // Helper to get userId from in-memory auth storage (NO localStorage)
  const getUserId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const user = sessionClient.getUser();
      if (user) {
        return user.id;
      }
    } catch { }
    return null;
  }, []);

  // ── DB-FIRST SESSION LOADING ──────────────────────────────────────────────
  const dbLoadDoneRef = useRef(false);
  const clientTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || dbLoadDoneRef.current) return;

    // Generate timestamp once to avoid hydration mismatch
    if (!clientTimestampRef.current) {
      clientTimestampRef.current = new Date().toLocaleTimeString();
    }
    const currentTimestamp = clientTimestampRef.current;

    const userId = getUserId();

    if (userId) {
      setIsLoggedIn(true);
      dbLoadDoneRef.current = true;

      (async () => {
        try {
          const data = await sessionApiService.loadSessions(initialAgentId, userId);
          console.log('[App] DB load result:', { success: data.success, count: data.sessions?.length, activeSessionId: data.activeSessionId });

          if (data.success && data.sessions && data.sessions.length > 0) {
            // Use DB sessions as source of truth
            // If a session has no messages, inject a welcome message
            const welcomeMessage: Message = {
              id: 'init-welcome',
              sender: 'AGENT',
              text: 'Hello! I\'m ready to help you. Feel free to ask me anything, upload images, or request me to generate images for you.',
              timestamp: currentTimestamp
            };
            const dbSessions: ChatSession[] = data.sessions.map((s) => ({
              id: s.id,
              name: s.name,
              active: s.active || false,
              messages: (s.messages && s.messages.length > 0)
                ? s.messages.map((message) => ({
                    id: message.id,
                    sender: message.sender,
                    text: message.text,
                    timestamp: message.timestamp,
                  }))
                : [welcomeMessage],
              settings: { ...initialSettings, ...(s.settings || {}) },
            }));

            // Ensure at least one is active
            const hasActive = dbSessions.some(s => s.active);
            if (!hasActive && dbSessions.length > 0) {
              dbSessions[0].active = true;
            }

            setSessions(dbSessions);
            setSessionsReady(true);

            // Load virtual files for active session (only for DB-synced sessions)
            const activeId = data.activeSessionId || dbSessions.find((s) => s.active)?.id;
            if (activeId && activeId.startsWith('sess-')) {
              sessionApiService.loadFiles(activeId, userId).then(fData => {
                if (fData.success && fData.files) {
                  setProjectFiles(fData.files as Record<string, string>);
                }
              }).catch(() => { });
            }

            return; // DB load successful
          }
        } catch (e) {
          console.error('[App] DB session load failed:', e);
        }

        const firstSession: ChatSession = {
          id: `sess-${crypto.randomUUID()}`,
          name: 'New Chat',
          active: true,
          messages: [{
            id: 'init-welcome',
            sender: 'AGENT',
            text: 'Hello! I am ready to help. Ask a question or attach an image to get started.',
            timestamp: currentTimestamp,
          }],
          settings: initialSettings,
        };
        try {
          await sessionApiService.createSession(userId, {
            title: firstSession.name,
            agentId: initialAgentId,
            settings: firstSession.settings,
            localId: firstSession.id,
          });
          setSessions([firstSession]);
          setSessionsReady(true);
        } catch (error) {
          console.error('[App] Could not create the first session:', error);
          toast.error('Saved sessions are unavailable; this conversation will remain in memory.');
          setSessions([firstSession]);
        }
      })();
    } else {
      dbLoadDoneRef.current = true;
      setSessions(defaultSessions.map((session) => ({
        ...session,
        messages: session.messages.map((message) => ({
          ...message,
          timestamp: currentTimestamp,
        })),
      })));
    }
  }, [initialAgentId, getUserId]);

  // Account-owned sessions sync to the database; otherwise, chat state stays in memory.

  // ── SYNC ACTIVE SESSION TO DB ─────────────────────────────────────────────
  const lastActiveRef = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoggedIn) return;
    const active = sessions.find(s => s.active);
    if (active && active.id !== lastActiveRef.current && active.id.startsWith('sess-')) {
      lastActiveRef.current = active.id;
      const userId = getUserId();
      if (userId) {
        sessionApiService.setActive(active.id, userId).catch(() => { });
      }
    }
  }, [sessions, isLoggedIn, getUserId]);

  // ── PERSIST VIRTUAL FILES TO DB ───────────────────────────────────────────
  const filesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoggedIn) return;
    if (Object.keys(projectFiles).length === 0) return;

    // Debounce: save files 2s after last change
    if (filesSaveTimerRef.current) clearTimeout(filesSaveTimerRef.current);
    filesSaveTimerRef.current = setTimeout(() => {
      const active = sessions.find(s => s.active);
      const userId = getUserId();
      if (active && userId && active.id.startsWith('sess-')) {
        sessionApiService.saveFiles(active.id, userId, projectFiles).catch(() => { });
      }
    }, 2000);

    return () => {
      if (filesSaveTimerRef.current) clearTimeout(filesSaveTimerRef.current);
    };
  }, [projectFiles, isLoggedIn, sessions, getUserId]);

  const activeSession = sessions.find(s => s.active) || sessions[0];

  const handleSend = async (text: string, imageData?: ImageData) => {
    if (isThinking || !sessionsReady) {
      console.log('[Chat] Blocked - already processing a request');
      return;
    }

    // Get userId for DB persistence (from in-memory auth — NO localStorage)
    let persistUserId: string | undefined;
    try {
      const user = sessionClient.getUser();
      if (user) {
        persistUserId = user.id;
      }
    } catch { }
    const persistSessionId = activeSession?.id;

    const timestamp = new Date().toLocaleTimeString();
    const userMsg: Message = { id: Date.now().toString(), sender: 'YOU', text, timestamp };

    setSessions(prev => prev.map(s =>
      s.active ? { ...s, messages: [...s.messages, userMsg] } : s
    ));

    setIsThinking(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Create placeholder message for streaming
    const agentMsgId = (Date.now() + 1).toString();
    const streamingMsg: Message = {
      id: agentMsgId,
      sender: 'AGENT',
      text: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true,
    };

    // Add empty agent message immediately for streaming
    setSessions(prev => prev.map(s =>
      s.active ? { ...s, messages: [...s.messages, streamingMsg] } : s
    ));

    try {
      // Build conversation history for backend API
      const history = formatConversationHistory(
        activeSession.messages.map(m => ({ sender: m.sender, text: m.text }))
      );

      // If there's an image, use non-streaming API (vision)
      if (imageData) {
        console.log('[Chat] Sending request with vision (non-streaming)...');
        const result = await sendMessage(
          text,
          activeSession.settings,
          history,
          imageData,
          abortControllerRef.current.signal,
          persistSessionId,
          persistUserId
        );

        // Update the streaming message with final result
        setSessions(prev => prev.map(s =>
          s.active ? {
            ...s,
            messages: s.messages.map(m =>
              m.id === agentMsgId
                ? { ...m, text: result.text, isStreaming: false }
                : m
            )
          } : s
        ));
      } else {
        // Use streaming API for text-only requests
        console.log('[Chat] Starting streaming response...');

        await sendMessageStream(
          text,
          activeSession.settings,
          history,
          {
            onToken: (token: string) => {
              // Immediate token-by-token rendering (React 18 auto-batches)
              setSessions(prev => prev.map(s =>
                s.active ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === agentMsgId
                      ? { ...m, text: m.text + token }
                      : m
                  )
                } : s
              ));
            },
            onComplete: (fullText: string, provider: string) => {
              console.log(`[Neural-Link] Streaming complete from: ${provider}`);
              // Set final complete text and mark done
              setSessions(prev => prev.map(s =>
                s.active ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === agentMsgId
                      ? { ...m, text: fullText, isStreaming: false }
                      : m
                  )
                } : s
              ));
            },
            onError: (error: Error) => {
              console.error('[Chat] Streaming error:', error);
              // Update message with user-friendly error
              setSessions(prev => prev.map(s =>
                s.active ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === agentMsgId
                      ? { ...m, text: `❌ Error: ${sanitizeErrorMessage(error)}`, isStreaming: false }
                      : m
                  )
                } : s
              ));
            },
            onFileOperation: (op: FileOperation) => {
              console.log('[Chat] File operation received:', op.action, op.path);
              setProjectFiles(prev => {
                const next = { ...prev };
                switch (op.action) {
                  case 'update_file':
                  case 'create_folder':
                  case 'append_to_file':
                    if (op.path && op.content !== undefined) {
                      next[op.path] = op.content;
                    }
                    break;
                  case 'delete_file':
                    if (op.path) delete next[op.path];
                    break;
                  case 'rename_file':
                    if (op.oldPath && op.newPath && next[op.oldPath] !== undefined) {
                      next[op.newPath] = next[op.oldPath];
                      delete next[op.oldPath];
                    }
                    break;
                  case 'copy_file':
                    if (op.sourcePath && op.destinationPath && next[op.sourcePath] !== undefined) {
                      next[op.destinationPath] = next[op.sourcePath];
                    }
                    break;
                }
                return next;
              });
              // File panel available via toolbar button — code renders inline in chat
            },
            onAgentUI: (event: AgentUIEvent) => {
              const { uiAction, text, title, level } = event;
              switch (uiAction) {
                case 'show_message':
                case 'show_toast':
                  toast.info(title || 'Agent', text || '');
                  break;
                case 'show_warning':
                  toast.warning(title || 'Warning', text || '');
                  break;
                case 'show_error':
                  toast.error(title || 'Error', text || '');
                  break;
                case 'show_progress':
                  toast.info(event.label || 'Working...', event.percent != null ? `${event.percent}%` : undefined);
                  break;
                case 'mode_change':
                  toast.info('Mode Changed', `Agent switched to ${event.mode || 'default'} mode`);
                  break;
                case 'workflow_started':
                  toast.info('Workflow Started', title || 'Executing multi-step workflow');
                  break;
                case 'workflow_step_update':
                  // Show step progress inline
                  if (event.step && typeof event.step === 'object') {
                    const step = event.step as { name?: string; status?: string };
                    toast.info(step.name || 'Step Update', step.status || 'in progress');
                  }
                  break;
                case 'workflow_cancelled':
                  toast.warning('Workflow Cancelled', title || 'Workflow was cancelled');
                  break;
                case 'ask_user':
                  // For now, show as info toast — full modal prompt can be added later
                  toast.info('Agent Question', event.question || text || '');
                  break;
                default:
                  if (text) toast.info(title || 'Agent', text);
              }
            },
          },
          abortControllerRef.current.signal,
          projectFiles,  // Send current files so backend can read/list them
          persistSessionId,
          persistUserId
        );
      }

    } catch (error: any) {
      console.error('[Chat] Error:', error);

      // If user aborted, handleStopGeneration already handled the UI — skip
      if (error.name === 'AbortError') return;

      // Update the streaming message with user-friendly error
      setSessions(prev => prev.map(s =>
        s.active ? {
          ...s,
          messages: s.messages.map(m =>
            m.id === agentMsgId
              ? { ...m, text: `❌ Error: ${sanitizeErrorMessage(error)}`, isStreaming: false }
              : m
          )
        } : s
      ));
    } finally {
      setIsThinking(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generation handler
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('[Chat] User requested to stop generation');
      abortControllerRef.current.abort();
      setIsThinking(false);

      // Mark the streaming message as complete (keep partial text) and append stop notice
      setSessions(prev => prev.map(s => {
        if (!s.active) return s;
        return {
          ...s,
          messages: s.messages.map(m =>
            m.isStreaming
              ? { ...m, text: (m.text || '') + '\n\n⏹️ *Generation stopped by user.*', isStreaming: false }
              : m
          ),
        };
      }));
    }
  }, []);

  // Regenerate last response — remove last agent message and resend the last user message
  const handleRegenerateResponse = useCallback(() => {
    if (isThinking) return;
    const msgs = activeSession.messages;
    // Find the last user message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender === 'YOU') { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const lastUserText = msgs[lastUserIdx].text;
    // Delete removed messages (agent responses after last user msg) from DB
    const removedMsgs = msgs.slice(lastUserIdx + 1);
    const userId = getUserId();
    if (userId && activeSession.id.startsWith('sess-')) {
      removedMsgs.forEach(m => {
        sessionApiService.deleteMessage(activeSession.id, m.id, userId).catch(() => {});
      });
    }
    // Remove all messages after the last user message (the agent responses)
    setSessions(prev => prev.map(s =>
      s.active ? { ...s, messages: s.messages.slice(0, lastUserIdx + 1) } : s
    ));
    // Re-send the same message
    setTimeout(() => handleSend(lastUserText), 100);
  }, [activeSession, isThinking, handleSend, getUserId]);

  const handleFileUpload = (file: File) => {
    console.log('[App] handleFileUpload called with:', file.name, file.type, file.size);

    // Prevent uploading while already thinking
    if (isThinking) {
      console.log('[Upload] Blocked - already processing');
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isDocument = ['pdf', 'doc', 'docx'].includes(fileExt);
    const isCode = ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'sql', 'sh'].includes(fileExt);
    const isSpreadsheet = ['csv', 'tsv'].includes(fileExt);
    const fileSizeKB = file.size / 1024;
    const fileSizeMB = fileSizeKB / 1024;

    console.log('[Upload] File type detection:', { isImage, isVideo, isDocument, isCode, isSpreadsheet, fileExt, fileSizeMB: fileSizeMB.toFixed(2) });

    // --- File size limits ---
    const MAX_IMAGE_MB = 10;
    const MAX_VIDEO_MB = 25;
    const MAX_DOCUMENT_MB = 10;
    const MAX_TEXT_MB = 5;

    const getFileTypeLabel = () => {
      if (isImage) return 'image';
      if (isVideo) return 'video';
      if (isDocument) return fileExt.toUpperCase();
      if (isSpreadsheet) return fileExt.toUpperCase();
      if (isCode) return fileExt.toUpperCase();
      return 'file';
    };

    const getMaxSize = () => {
      if (isImage) return MAX_IMAGE_MB;
      if (isVideo) return MAX_VIDEO_MB;
      if (isDocument) return MAX_DOCUMENT_MB;
      return MAX_TEXT_MB;
    };

    const maxSize = getMaxSize();
    if (fileSizeMB > maxSize) {
      // Show friendly error as a system message — don't send to AI
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: 'AGENT',
        text: `📁 **File too large**\n\nThe ${getFileTypeLabel()} file **${file.name}** (${fileSizeMB.toFixed(1)}MB) exceeds the ${maxSize}MB limit.\n\nPlease try a smaller file, or if it's a spreadsheet, consider reducing the number of rows before uploading.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setSessions(prev => prev.map(s =>
        s.active ? { ...s, messages: [...s.messages, errorMsg] } : s
      ));
      return;
    }

    // Determine file attachment type for display
    const getAttachmentType = (): 'pdf' | 'doc' | 'docx' | 'csv' | 'tsv' | 'code' | 'text' | 'image' | 'video' | 'spreadsheet' | 'unknown' => {
      if (['pdf'].includes(fileExt)) return 'pdf';
      if (['doc', 'docx'].includes(fileExt)) return 'docx';
      if (['csv'].includes(fileExt)) return 'csv';
      if (['tsv'].includes(fileExt)) return 'tsv';
      if (isCode) return 'code';
      if (isImage) return 'image';
      if (isVideo) return 'video';
      if (['txt', 'md'].includes(fileExt)) return 'text';
      return 'unknown';
    };

    // Handle PDF/DOCX documents - extract text server-side
    if (isDocument) {
      setIsThinking(true);

      // Show processing message
      const processingMsg: Message = {
        id: Date.now().toString(),
        sender: 'YOU',
        text: `Uploaded: **${file.name}**\n\n_Extracting text content..._`,
        timestamp: new Date().toLocaleTimeString(),
        fileAttachment: {
          name: file.name,
          type: getAttachmentType(),
          sizeKB: Math.round(fileSizeKB),
          meta: 'Extracting...'
        }
      };
      setSessions(prev => prev.map(s =>
        s.active ? { ...s, messages: [...s.messages, processingMsg] } : s
      ));

      // Extract document text via server API
      extractDocumentText(file)
        .then(async (docData) => {
          console.log('[Upload] Document extracted:', {
            fileName: docData.fileName,
            type: docData.fileType,
            pages: docData.pageCount,
            chars: docData.content.length
          });

          // Update the user message — keep it clean (no content dump in the chat bubble)
          setSessions(prev => prev.map(s => {
            if (!s.active) return s;
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (msgs[lastIdx]?.id === processingMsg.id) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                text: '',
                fileAttachment: {
                  name: file.name,
                  type: getAttachmentType(),
                  sizeKB: Math.round(fileSizeKB),
                  meta: docData.pageCount ? `${docData.pageCount} pages` : undefined
                }
              };
            }
            return { ...s, messages: msgs };
          }));

          // Cap document content to prevent context overflow
          const MAX_DOC_CHARS = 40000;
          const docContent = docData.content.length > MAX_DOC_CHARS
            ? docData.content.slice(0, MAX_DOC_CHARS) + '\n\n... (document truncated due to length)'
            : docData.content;

          // Send the document to AI for analysis
          try {
            const history = formatConversationHistory(
              activeSession.messages.map(m => ({ sender: m.sender, text: m.text }))
            );

            const prompt = `I have uploaded a document: "${docData.fileName}"${docData.pageCount ? ` with ${docData.pageCount} pages` : ''}.\n\nHere is the extracted text content:\n\n---\n${docContent}\n---\n\nPlease analyze this document and provide a summary of its key points.`;

            // Use streaming for the response
            const agentMsgId = (Date.now() + 1).toString();
            const agentMsg: Message = {
              id: agentMsgId,
              sender: 'AGENT',
              text: '',
              timestamp: new Date().toLocaleTimeString(),
              isStreaming: true
            };

            setSessions(prev => prev.map(s =>
              s.active ? { ...s, messages: [...s.messages, agentMsg] } : s
            ));

            await sendMessageStream(
              prompt,
              activeSession.settings,
              history,
              {
                onToken: (token) => {
                  setSessions(prev => prev.map(s => {
                    if (!s.active) return s;
                    return {
                      ...s,
                      messages: s.messages.map(m =>
                        m.id === agentMsgId ? { ...m, text: m.text + token } : m
                      )
                    };
                  }));
                },
                onComplete: () => {
                  console.log(`[Neural-Link] Document analysis complete`);
                  setSessions(prev => prev.map(s => {
                    if (!s.active) return s;
                    return {
                      ...s,
                      messages: s.messages.map(m =>
                        m.id === agentMsgId ? { ...m, isStreaming: false } : m
                      )
                    };
                  }));
                  setIsThinking(false);
                },
                onError: (error) => {
                  console.error('[Upload] Document analysis failed:', error);
                  setSessions(prev => prev.map(s => {
                    if (!s.active) return s;
                    return {
                      ...s,
                      messages: s.messages.map(m =>
                        m.id === agentMsgId ? {
                          ...m,
                          text: `❌ Error analyzing document: ${error}`,
                          isStreaming: false
                        } : m
                      )
                    };
                  }));
                  setIsThinking(false);
                }
              }
            );
          } catch (err) {
            console.error('[Upload] Document analysis failed:', err);
            const errorMsg: Message = {
              id: (Date.now() + 1).toString(),
              sender: 'AGENT',
              text: `❌ Error analyzing document: ${err instanceof Error ? err.message : 'Unknown error'}`,
              timestamp: new Date().toLocaleTimeString()
            };
            setSessions(prev => prev.map(s =>
              s.active ? { ...s, messages: [...s.messages, errorMsg] } : s
            ));
            setIsThinking(false);
          }
        })
        .catch((err) => {
          console.error('[Upload] Document extraction failed:', err);
          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'AGENT',
            text: `❌ Error extracting document text: ${err instanceof Error ? err.message : 'Unknown error'}`,
            timestamp: new Date().toLocaleTimeString()
          };
          setSessions(prev => prev.map(s =>
            s.active ? { ...s, messages: [...s.messages, errorMsg] } : s
          ));
          setIsThinking(false);
        });
      return;
    }

    // Handle other file types with FileReader
    const reader = new FileReader();
    reader.onload = async (e) => {
      console.log('[Upload] FileReader loaded');
      const content = e.target?.result as string;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isCode = file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.html') || file.name.endsWith('.css');

      console.log('[Upload] File type detection:', { isImage, isVideo, isCode });

      let type: CanvasState['type'] = 'text';
      if (isImage) type = 'image';
      else if (isVideo) type = 'video';
      else if (isCode) type = 'code';

      // Update canvas with the file content
      updateActiveSettings({
        ...activeSession.settings,
        workspaceMode: 'CANVAS',
        canvas: {
          ...activeSession.settings.canvas,
          content: content,
          type: type,
          title: `UPLOAD_${file.name.toUpperCase()}`
        }
      });

      // For images: Extract base64 and send to AI with vision capability
      if (isImage && content.startsWith('data:')) {
        const base64Match = content.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          const mimeType = base64Match[1];
          const base64Data = base64Match[2];

          console.log(`[Upload] Sending image to vision AI: ${file.name} (${(base64Data.length / 1024).toFixed(0)}KB base64)`);

          // Switch to CHAT view to see the AI response
          updateActiveSettings({
            ...activeSession.settings,
            workspaceMode: 'CHAT'
          });

          // Add user message with image preview to chat
          // NOTE: Don't store base64 in message text - use a placeholder
          const timestamp = new Date().toLocaleTimeString();
          const userMsgWithImage: Message = {
            id: Date.now().toString(),
            sender: 'YOU',
            text: `[Uploaded Image: ${file.name}]\n\nAnalyze this image`,
            timestamp,
            imagePreview: content, // Store image separately for display only
            fileAttachment: {
              name: file.name,
              type: 'image',
              sizeKB: Math.round(fileSizeKB)
            }
          };

          setSessions(prev => prev.map(s =>
            s.active ? { ...s, messages: [...s.messages, userMsgWithImage] } : s
          ));

          setIsThinking(true);

          // Send image with vision-enabled AI for real analysis
          try {
            const history = formatConversationHistory(
              activeSession.messages.map(m => ({ sender: m.sender, text: m.text }))
            );

            const result = await sendMessage(
              `Please analyze this image in detail. Describe what you see, any text, objects, people, colors, and any relevant information.`,
              activeSession.settings,
              history,
              { base64: base64Data, mimeType, fileName: file.name }
            );

            console.log(`[Neural-Link] Response from: ${result.provider} (${result.durationMs}ms) [Vision]`);

            const agentMsg: Message = {
              id: (Date.now() + 1).toString(),
              sender: 'AGENT',
              text: result.text,
              timestamp: new Date().toLocaleTimeString()
            };

            setSessions(prev => prev.map(s =>
              s.active ? { ...s, messages: [...s.messages, agentMsg] } : s
            ));
          } catch (err) {
            console.error('[Upload] Vision request failed:', err);
            const errorMsg: Message = {
              id: (Date.now() + 1).toString(),
              sender: 'AGENT',
              text: `❌ Error analyzing image: ${err instanceof Error ? err.message : 'Unknown error'}`,
              timestamp: new Date().toLocaleTimeString()
            };
            setSessions(prev => prev.map(s =>
              s.active ? { ...s, messages: [...s.messages, errorMsg] } : s
            ));
          } finally {
            setIsThinking(false);
          }
          return;
        }
      }

      // For text files (code, documents, CSV): Include content in message
      if (!isImage && !isVideo) {
        const MAX_CONTENT_CHARS = 40000; // ~10K tokens, safe for any model context
        let displayContent = content;
        let fileMeta = '';
        let attachmentMeta: string | undefined;

        if (isSpreadsheet) {
          // Smart CSV/TSV handling: parse headers + first N rows
          const delimiter = fileExt === 'tsv' ? '\t' : ',';
          const lines = content.split('\n').filter((l: string) => l.trim());
          const totalRows = lines.length - 1; // exclude header
          const totalCols = lines[0] ? lines[0].split(delimiter).length : 0;
          fileMeta = `File: ${file.name} (${(fileSizeKB).toFixed(1)}KB, ${totalRows.toLocaleString()} rows, ${totalCols} columns)\n\n`;
          attachmentMeta = `${totalRows.toLocaleString()} rows, ${totalCols} columns`;

          // Take header + first 50 rows (or fewer if file is small)
          const previewRows = Math.min(51, lines.length); // 1 header + 50 data rows
          displayContent = lines.slice(0, previewRows).join('\n');
          if (lines.length > previewRows) {
            displayContent += `\n... (${(totalRows - 50).toLocaleString()} more rows truncated)`;
          }
        } else if (content.length > MAX_CONTENT_CHARS) {
          // Universal size cap for any text file
          fileMeta = `File: ${file.name} (${(fileSizeKB).toFixed(1)}KB, truncated to first ~${MAX_CONTENT_CHARS.toLocaleString()} characters)\n\n`;
          displayContent = content.slice(0, MAX_CONTENT_CHARS) + '\n... (content truncated)';
        }

        // Build the full prompt for the AI (content not shown in the chat bubble)
        const aiPrompt = `${fileMeta}I have uploaded a file: ${file.name}\n\nHere is the content:\n\`\`\`\n${displayContent}\n\`\`\`\n\nPlease analyze this file.`;

        // Add a user message with file attachment card only (no content dump)
        const fileMsg: Message = {
          id: Date.now().toString(),
          sender: 'YOU',
          text: '',
          timestamp: new Date().toLocaleTimeString(),
          fileAttachment: {
            name: file.name,
            type: getAttachmentType(),
            sizeKB: Math.round(fileSizeKB),
            meta: attachmentMeta
          }
        };
        setSessions(prev => prev.map(s =>
          s.active ? { ...s, messages: [...s.messages, fileMsg] } : s
        ));

        // Trigger AI analysis using streaming
        setIsThinking(true);
        abortControllerRef.current = new AbortController();

        const agentMsgId = (Date.now() + 1).toString();
        const streamingMsg: Message = {
          id: agentMsgId,
          sender: 'AGENT',
          text: '',
          timestamp: new Date().toLocaleTimeString(),
          isStreaming: true,
        };
        setSessions(prev => prev.map(s =>
          s.active ? { ...s, messages: [...s.messages, streamingMsg] } : s
        ));

        try {
          const history = formatConversationHistory(
            activeSession.messages.map(m => ({ sender: m.sender, text: m.text }))
          );

          await sendMessageStream(
            aiPrompt,
            activeSession.settings,
            history,
            {
              onToken: (token) => {
                setSessions(prev => prev.map(s => {
                  if (!s.active) return s;
                  return {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === agentMsgId ? { ...m, text: m.text + token } : m
                    )
                  };
                }));
              },
              onComplete: () => {
                setSessions(prev => prev.map(s => {
                  if (!s.active) return s;
                  return {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === agentMsgId ? { ...m, isStreaming: false } : m
                    )
                  };
                }));
                setIsThinking(false);
              },
              onError: (error) => {
                setSessions(prev => prev.map(s => {
                  if (!s.active) return s;
                  return {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === agentMsgId ? {
                        ...m,
                        text: `❌ Error analyzing file: ${error}`,
                        isStreaming: false
                      } : m
                    )
                  };
                }));
                setIsThinking(false);
              }
            },
            abortControllerRef.current.signal
          );
        } catch (err) {
          console.error('[Upload] File analysis failed:', err);
          setSessions(prev => prev.map(s => {
            if (!s.active) return s;
            return {
              ...s,
              messages: s.messages.map(m =>
                m.id === agentMsgId ? {
                  ...m,
                  text: `❌ Error analyzing file: ${err instanceof Error ? err.message : 'Unknown error'}`,
                  isStreaming: false
                } : m
              )
            };
          }));
          setIsThinking(false);
        }
        return;
      }

      // Fallback for other file types
      await handleSend(`I have uploaded a file: ${file.name}. Please analyze it in the workspace.`);
    };

    reader.onerror = (err) => {
      console.error('[Upload] File read error:', err);
    };

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const toggleSTT = () => {
    if (isRecordingSTT) {
      // Stop recording - set flag to prevent restart
      if (recognitionRef.current) {
        (recognitionRef.current as any).__shouldRestart = false;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecordingSTT(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.warning('Speech Recognition not supported in this browser.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Track final transcripts to avoid duplicates
      let finalTranscript = '';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';

        // Process results - only add new final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update voice text with final + interim (interim shown in grey in input)
        setVoiceText(finalTranscript + interimTranscript);
      };

      // Don't auto-close - only close when user manually stops
      // Use a flag on the recognition object to track if we should restart
      (recognition as any).__shouldRestart = true;

      recognition.onend = () => {
        // If still supposed to be recording, restart (handles browser auto-stop)
        if (recognitionRef.current && (recognitionRef.current as any).__shouldRestart) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or other error
            console.log('[STT] Could not restart:', e);
            setIsRecordingSTT(false);
          }
        } else {
          setIsRecordingSTT(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[STT] Error:', event.error);
        if (event.error === 'aborted') {
          // User stopped - this is fine
          return;
        }
        // Prevent onend from restarting after a real error
        (recognition as any).__shouldRestart = false;
        recognitionRef.current = null;
        setIsRecordingSTT(false);
      };

      recognition.start();
      setIsRecordingSTT(true);
      setVoiceText(''); // Clear previous transcript
      recognitionRef.current = recognition;
    }
  };

  const deleteSession = async (id: string) => {
    const userId = getUserId();
    if (!userId) return;
    const remaining = sessions.filter((session) => session.id !== id);
    const replacement: ChatSession | null = remaining.length
      ? null
      : {
          id: `sess-${crypto.randomUUID()}`,
          name: 'New Chat',
          active: true,
          messages: [],
          settings: initialSettings,
        };
    try {
      if (replacement) {
        await sessionApiService.createSession(userId, {
          title: replacement.name,
          agentId: initialAgentId,
          settings: replacement.settings,
          localId: replacement.id,
        });
      }
      await sessionApiService.deleteSession(id, userId);
      if (remaining.length > 0) {
        const nextSessions = remaining.map((session, index) => ({
          ...session,
          active: sessions.find((previous) => previous.id === id)?.active
            ? index === 0
            : session.active,
        }));
        setSessions(nextSessions);
        const active = nextSessions.find((session) => session.active);
        if (active) await sessionApiService.setActive(active.id, userId);
      } else if (replacement) {
        setSessions([replacement]);
      }
    } catch (error) {
      console.error('[App] Could not delete session:', error);
      toast.error('Could not delete the session. Please try again.');
    }
  };

  const renameSession = async (id: string, newName: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      await sessionApiService.renameSession(id, userId, newName);
      setSessions((previous) =>
        previous.map((session) =>
          session.id === id ? { ...session, name: newName } : session,
        ),
      );
    } catch (error) {
      console.error('[App] Could not rename session:', error);
      toast.error('Could not rename the session. Please try again.');
    }
  };

  const handleApplyPreset = (type: string) => {
    const preset = NEURAL_PRESETS[type];
    if (!preset) return;
    updateActiveSettings({ ...activeSession.settings, customPrompt: preset.prompt, temperature: preset.temp });
  };

  const createNewSession = async () => {
    const userId = getUserId();
    if (!userId) return;
    const id = `sess-${crypto.randomUUID()}`;
    const newSession: ChatSession = {
      id, name: `PROTOCOL_LOG_${id.slice(-4)}`, active: true,
      messages: [{ id: `init-${id}`, sender: 'AGENT', text: 'Hi! How can I help you today?', timestamp: new Date().toLocaleTimeString() }],
      settings: initialSettings
    };
    try {
      await sessionApiService.createSession(userId, {
        title: newSession.name,
        agentId: initialAgentId,
        settings: newSession.settings,
        localId: id,
      });
      setSessions(prev => prev.map(s => ({ ...s, active: false })).concat(newSession));
    } catch (error) {
      console.error('[App] Could not create a session:', error);
      toast.error('Could not create a session. Please try again.');
    }
  };

  const selectSession = async (id: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      await sessionApiService.setActive(id, userId);
      setSessions(prev => prev.map(s => ({ ...s, active: s.id === id })));
    } catch (error) {
      console.error('[App] Could not select session:', error);
      toast.error('Could not switch sessions. Please try again.');
      return;
    }
    // Load virtual files for newly selected session (only for DB-synced sessions)
    if (isLoggedIn && id.startsWith('sess-')) {
      sessionApiService.loadFiles(id, userId).then(data => {
        if (data.success && data.files) {
          setProjectFiles(data.files);
        } else {
          setProjectFiles({});
        }
      }).catch((error) => {
        console.error('[App] Could not load session files:', error);
        toast.error('Could not load session files.');
        setProjectFiles({});
      });
    }
  };

  const updateActiveSettings = (settings: SettingsState) => {
    setSessions(prev => prev.map(s => s.active ? { ...s, settings } : s));
    const userId = getUserId();
    if (userId && activeSession?.id.startsWith('sess-')) {
      sessionApiService.updateSettings(activeSession.id, userId, settings)
        .catch((error) => console.error('[App] Could not save session settings:', error));
    }
  };

  return (
    <div className="text-gray-300 h-screen flex flex-col overflow-hidden relative selection:bg-green-500/30 selection:text-white font-mono" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(74, 222, 128, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.08) 0%, transparent 40%), linear-gradient(135deg, #0A0A0A 0%, #111111 100%)' }}>
      <ToastContainer />

      <Overlay active={isOverlayActive} onActivate={() => setIsOverlayActive(false)} agentName={initialAgentName} />
      <div className={`flex flex-col h-full transition-opacity duration-300 ${isNavDrawerOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header
          onToggleLeft={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          onToggleRight={() => setIsRightPanelOpen(!isRightPanelOpen)}
          onToggleNav={() => setIsNavDrawerOpen(!isNavDrawerOpen)}
          onToggleFiles={() => setIsFilePanelOpen(!isFilePanelOpen)}
          onToggleHelp={() => setIsHelpPanelOpen(!isHelpPanelOpen)}
          fileCount={Object.keys(projectFiles).length}
          onClear={() => {
            const active = sessions.find(s => s.active);
            setSessions(prev => prev.map(s => s.active ? { ...s, messages: [] } : s));
            // Sync clear to DB
            const userId = getUserId();
            if (userId && active && active.id.startsWith('sess-')) {
              sessionApiService.deleteAllMessages(active.id, userId).catch(() => {});
            }
          }}
          onLock={() => setIsOverlayActive(true)}
          leftOpen={isLeftPanelOpen} rightOpen={isRightPanelOpen} helpOpen={isHelpPanelOpen}
        />
        <div className="flex-grow flex relative overflow-hidden z-10">
          {(isLeftPanelOpen || isRightPanelOpen || isHelpPanelOpen) && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[50] transition-opacity animate-in fade-in duration-300" onClick={() => { setIsLeftPanelOpen(false); setIsRightPanelOpen(false); setIsHelpPanelOpen(false); }}></div>
          )}
          <Sidebar
            sessions={sessions}
            onSelect={selectSession}
            onCreate={createNewSession}
            onDelete={deleteSession}
            onRename={renameSession}
            isOpen={isLeftPanelOpen}
          />
          <ChatBox
            messages={activeSession.messages} isThinking={isThinking || !sessionsReady}
            isRecordingSTT={isRecordingSTT}
            onSend={handleSend} onFileUpload={handleFileUpload}
            onToggleSTT={toggleSTT}
            agentSettings={activeSession.settings} onUpdateSettings={updateActiveSettings}
            onStopGeneration={handleStopGeneration}
            onRegenerateResponse={handleRegenerateResponse}
            voiceText={voiceText}
            onClearVoiceText={() => setVoiceText('')}
            onEditMessage={(messageId: string, newContent: string) => {
              // Update local state
              setSessions(prev => prev.map(s =>
                s.active ? { ...s, messages: s.messages.map(m => m.id === messageId ? { ...m, text: newContent } : m) } : s
              ));
              // Sync edit to DB
              const userId = getUserId();
              if (userId && activeSession.id.startsWith('sess-')) {
                sessionApiService.updateMessage(activeSession.id, messageId, userId, newContent).catch(() => {});
              }
            }}
            onPinChange={(pinnedIds: string[]) => {
              // Persist pinned message IDs to DB via session settings
              const userId = getUserId();
              if (userId && activeSession.id.startsWith('sess-')) {
                sessionApiService.updateSettings(activeSession.id, userId, { pinnedMessageIds: pinnedIds }).catch(() => {});
              }
            }}
            pinnedMessageIds={activeSession.settings.pinnedMessageIds || []}
          />
          <SettingsPanel settings={activeSession.settings} onChange={updateActiveSettings} onApplyPreset={handleApplyPreset} onReset={() => updateActiveSettings({ ...activeSession.settings, ...DEFAULT_SETTINGS })} isOpen={isRightPanelOpen} />
          <HelpPanel isOpen={isHelpPanelOpen} onClose={() => setIsHelpPanelOpen(false)} />
        </div>
        <Footer />
      </div>
      <NavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        currentSettings={activeSession.settings}
        onSettingsChange={updateActiveSettings}
        agentId={initialAgentId}
        agentName={initialAgentName}
        agentIcon={agentIcon}
        agentSpecialty={agentSpecialty}
        agentColor={agentColor}
        agentCategory={agentCategory}
        agentProvider={'openai'}
        agentModel={'gpt-4o'}
        agentFallbacks={[]}
        messages={activeSession.messages}
        sessions={sessions}
        onModuleSelect={(item: NavItem) => {
          let mode: WorkspaceMode = 'CHAT';
          if (item.tool === 'browser') mode = 'PORTAL';
          else if (item.tool === 'canvas') mode = 'CANVAS';
          updateActiveSettings({ ...activeSession.settings, activeTool: item.tool, workspaceMode: mode });
          setIsNavDrawerOpen(false);
        }} />

      <FilePanel
        files={projectFiles}
        isOpen={isFilePanelOpen}
        onClose={() => setIsFilePanelOpen(false)}
        onDeleteFile={(path) => {
          setProjectFiles(prev => {
            const next = { ...prev };
            delete next[path];
            return next;
          });
          // Sync delete to DB
          const userId = getUserId();
          const active = sessions.find(s => s.active);
          if (userId && active && active.id.startsWith('sess-')) {
            sessionApiService.deleteFile(active.id, path, userId).catch(() => {});
          }
        }}
      />
    </div>
  );
};

export default App;
