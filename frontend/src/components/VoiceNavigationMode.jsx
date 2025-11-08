import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * AI Voice Navigation Mode
 * Conversational voice interface for browser navigation
 */
function VoiceNavigationMode({ isActive, onClose, onNavigate }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const synthRef = useRef(window.speechSynthesis);
  const silenceTimeoutRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const minRecordingTime = 60000; // 1 minute in milliseconds

  // Initialize on mount
  useEffect(() => {
    if (!isActive) return;

    // Start with greeting
    speakGreeting();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch (e) {
          console.warn('[VoiceNav] Could not cancel speech on cleanup:', e);
        }
      }
    };
  }, [isActive]);

  // Greeting message
  const speakGreeting = () => {
    const greeting = "Hi! I'm your voice assistant. What website or topic would you like me to open or search today?";
    speak(greeting);
    addToHistory('AI', greeting);
  };

  // Start/Stop listening
  const toggleListening = async () => {
    if (isListening) {
      // Stop recording and process
      stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      console.log('[VoiceNav] Starting audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('[VoiceNav] Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('[VoiceNav] Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('[VoiceNav] Audio blob size:', audioBlob.size, 'bytes');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        await processAudioCommand(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      setRecordingStartTime(Date.now());
      
      // Start duration timer
      startRecordingTimer();
      
      console.log('[VoiceNav] Recording started successfully');
    } catch (error) {
      console.error('[VoiceNav] Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      console.log('[VoiceNav] Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsListening(false);
      
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingDuration(0);
    }
  };

  // Start recording duration timer
  const startRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const newDuration = prev + 1;
        
        // Auto-stop after 1 minute
        if (newDuration >= 60) {
          stopRecording();
          return 0;
        }
        
        return newDuration;
      });
    }, 1000);
  };

  // Process audio command
  const processAudioCommand = async (audioBlob) => {
    setIsProcessing(true);
    try {
      console.log('[VoiceNav] Converting audio to base64...');
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        console.log('[VoiceNav] Base64 audio length:', base64Audio.length);
        
        try {
          console.log('[VoiceNav] Sending to backend for transcription...');
          // Send to backend for transcription
          const response = await axios.post(`${API_URL}/api/voice/command`, {
            audio_data: base64Audio
          });

          console.log('[VoiceNav] Backend response:', response.data);
          const { transcript, action, data } = response.data;
          
          if (transcript) {
            console.log('[VoiceNav] Transcribed text:', transcript);
            addToHistory('You', transcript);
            
            // Process the transcript as a voice command
            handleVoiceCommand(transcript);
          } else {
            console.log('[VoiceNav] No transcript in response');
            speak("I didn't hear anything. Please try again.");
            addToHistory('AI', "I didn't hear anything. Please try again.");
          }
        } catch (error) {
          console.error('[VoiceNav] Error sending to backend:', error);
          speak("Sorry, I couldn't process that. Please try again.");
          addToHistory('AI', "Sorry, I couldn't process that. Please try again.");
        }
      };
      
      reader.onerror = (error) => {
        console.error('[VoiceNav] Error reading audio file:', error);
        speak("Sorry, there was an error processing the audio.");
      };
    } catch (error) {
      console.error('[VoiceNav] Error processing audio command:', error);
      speak("Sorry, I couldn't process that. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset silence timer (30 seconds of inactivity)
  const resetSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    silenceTimeoutRef.current = setTimeout(() => {
      speak("You've been quiet for a while. Exiting voice navigation mode. Goodbye!");
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 30000); // 30 seconds
  };

  // Text-to-Speech
  const speak = (text) => {
    if (isMuted) return;

    // Check if speech synthesis is available
    if (!synthRef.current) {
      console.warn('[VoiceNav] Speech synthesis not available');
      setAiResponse(text);
      return;
    }

    // Cancel any ongoing speech
    try {
      synthRef.current.cancel();
    } catch (e) {
      console.warn('[VoiceNav] Could not cancel speech:', e);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAiResponse(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-start listening after AI finishes speaking
      if (isActive && !isListening && !isProcessing) {
        setTimeout(() => {
          startRecording();
        }, 800);
      }
    };

    utterance.onerror = (event) => {
      console.error('[VoiceNav] Speech error:', event);
      setIsSpeaking(false);
    };

    try {
      synthRef.current.speak(utterance);
    } catch (e) {
      console.error('[VoiceNav] Could not speak:', e);
      setIsSpeaking(false);
    }
  };

  // Handle voice command
  const handleVoiceCommand = async (command) => {

    try {
      // Send to AI backend for processing
      const response = await axios.post(`${API_URL}/api/ai/voice-command`, {
        command: command,
        history: conversationHistory.slice(-5) // Last 5 messages for context
      });

      const { action, response: aiText, url } = response.data;

      // Handle different action types
      if (action === 'navigate') {
        // Navigation command
        speak(aiText);
        addToHistory('AI', aiText);
        
        if (url) {
          setTimeout(() => {
            onNavigate(url);
            setTimeout(() => {
              speak("What would you like to do next?");
              addToHistory('AI', "What would you like to do next?");
            }, 2000);
          }, 1500);
        }
      } else if (action === 'answer') {
        // Question/answer
        speak(aiText);
        addToHistory('AI', aiText);
        
        setTimeout(() => {
          speak("Would you like to search for something else?");
          addToHistory('AI', "Would you like to search for something else?");
        }, aiText.length * 50); // Delay based on response length
      } else if (action === 'exit') {
        // Exit command
        speak(aiText || "Goodbye! Exiting voice navigation mode.");
        addToHistory('AI', aiText || "Goodbye!");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Default response
        speak(aiText);
        addToHistory('AI', aiText);
      }

    } catch (error) {
      console.error('[VoiceNav] Error processing command:', error);
      const errorMsg = "I'm sorry, I couldn't process that. Could you please try again?";
      speak(errorMsg);
      addToHistory('AI', errorMsg);
    }
  };

  // Add message to conversation history
  const addToHistory = (speaker, message) => {
    setConversationHistory(prev => [...prev, { speaker, message, timestamp: Date.now() }]);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {
        console.warn('[VoiceNav] Could not cancel speech on mute:', e);
      }
      setIsSpeaking(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-background border-t-2 border-primary shadow-2xl w-full h-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-primary/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}>
              <Mic className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">🎙️ Voice Navigation Mode</h2>
              <p className="text-sm text-muted-foreground">
                {isSpeaking ? '🔊 AI is speaking...' : isListening ? '👂 Listening...' : '⏸️ Paused'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversationHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.speaker === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.speaker === 'You'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <p className="text-xs font-semibold mb-1 opacity-70">{msg.speaker}</p>
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
          ))}

          {/* Recording indicator */}
          {isListening && (
            <div className="flex justify-end">
              <div className="max-w-[80%] p-3 rounded-lg bg-primary/50 text-primary-foreground border-2 border-primary border-dashed">
                <p className="text-xs font-semibold mb-1 opacity-70 flex items-center justify-between">
                  <span>🎤 Recording audio...</span>
                  <span className="text-xs font-mono">{recordingDuration}s / 60s</span>
                </p>
                <p className="text-sm italic">Speak now, processing will happen when you stop</p>
              </div>
            </div>
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-center">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Processing your voice command...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-3 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isListening ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Recording... ({recordingDuration}s / 60s) - Click mic to stop
                </span>
              ) : (
                'Click the microphone to speak'
              )}
            </div>
            <button
              onClick={toggleListening}
              className={`p-4 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-primary hover:bg-primary/80'
              }`}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff className="text-white" size={28} /> : <Mic className="text-white" size={28} />}
            </button>
          </div>
          
          <div className="mt-3 text-xs text-center text-muted-foreground">
            💡 Speak for up to 60 seconds or click mic to stop • Try: "Open YouTube" • "Search for Python tutorials"
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceNavigationMode;
