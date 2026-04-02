'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { saveMissionResult } from '@/lib/db'

export function useGeminiLiveHook(videoElementId) {
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState({ user: '', assistant: '' })
  const [conversation, setConversation] = useState([]) // [{ role: 'user' | 'assistant', text: string, timestamp: number }]
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [completedMissions, setCompletedMissions] = useState(new Set())
  
  const wsRef = useRef(null)
  const audioCtxRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const transcriptRef = useRef({ user: '', assistant: '' })
  const audioWorkletNodeRef = useRef(null)
  const playbackScheduledAtRef = useRef(0)
  const canvasRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const activeSourcesRef = useRef([])

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev, msg])
  }, [])

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(0) } catch (e) {}
    })
    activeSourcesRef.current = []
    if (audioCtxRef.current) {
      playbackScheduledAtRef.current = audioCtxRef.current.currentTime
    }
    setIsSpeaking(false)
  }, [])

  const stopSession = useCallback((reason = '사용자 요청') => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    stopPlayback()

    if (wsRef.current) wsRef.current.close()
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop())
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) audioCtxRef.current.close()
    
    wsRef.current = null
    mediaStreamRef.current = null
    screenStreamRef.current = null
    audioCtxRef.current = null
    playbackScheduledAtRef.current = 0
    setStatus('idle')
    setIsSpeaking(false)
    const reasonStr = typeof reason === 'string' ? reason : '사용자 요청';
    addLog(`[시스템] 세션이 종료되었습니다. (사유: ${reasonStr})`)
  }, [addLog, stopPlayback])

  const sendVideoFrame = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    const track = screenStreamRef.current?.getTracks()[0]
    if (track && track.readyState === 'ended') {
      addLog('[시스템] 미러링 스트림이 비정상 종료되었습니다.')
      stopSession('미러링 트랙 손상')
      return
    }
    const videoEl = document.getElementById(videoElementId)
    if (!videoEl || !canvasRef.current || videoEl.videoWidth === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Balanced resolution (1280px) for both OCR and Low Latency
    if (canvas.width !== 1280) {
      canvas.width = 1280
      canvas.height = videoEl.videoHeight * (1280 / videoEl.videoWidth)
    }
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    // Quality 0.85 (85%) as the sweet spot for speed/clarity
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]
    if (base64) {
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          video: { mime_type: 'image/jpeg', data: base64 }
        }
      }))
    }
  }, [videoElementId, addLog, stopSession])

  const startSession = useCallback(async (project) => {
    try {
      if (!project) return;
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      const modelIdentifier = 'models/gemini-3.1-flash-live-preview';
      const baseUrl = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
      const wssUrl = `${baseUrl}?key=${apiKey}`;
      
      setStatus('connecting')
      addLog(`[시스템] Gemini 3.1 Flash Live (v1alpha) 접속 시도 중...`)

      const req = project.media_requirements || { audio: true, camera: false, screen: false };

      // 1. Audio/Camera Permission (UserMedia)
      if (req.audio || req.camera) {
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: req.audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
          video: req.camera ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
        })
        mediaStreamRef.current = micStream
      }

      // 2. Screen Share Permission (DisplayMedia)
      if (req.screen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }, 
          audio: false 
        })
        screenStreamRef.current = screenStream

        screenStream.getTracks().forEach(track => {
          track.onended = () => {
            if (status === 'active') {
              addLog('[시스템] 사용자가 화면 공유를 중단했습니다.')
              stopSession('미러링 중단됨')
            }
          }
        })

        const videoEl = document.getElementById(videoElementId)
        if (videoEl) {
          videoEl.srcObject = screenStream
          videoEl.muted = true
          videoEl.playsInline = true
          videoEl.onloadedmetadata = () => {
            videoEl.play().catch(e => addLog(`[시스템] 비디오 재생 실패: ${e.message}`))
          }
        }

        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas')
          canvasRef.current.width = 1280
          canvasRef.current.height = 720
        }
      }
      
      const ws = new WebSocket(wssUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[GEMINI WS] Connection established. Sending setup...");
        addLog('[시스템] 소켓 연결 성공. 설정 전송 중...')
        
        let selectedVoice = project.voice_id || 'Puck';
        if (selectedVoice.startsWith('voice-')) {
          console.warn(`[GEMINI WS] Invalid voice ID detected: ${selectedVoice}. Falling back to 'Puck'.`);
          selectedVoice = 'Puck';
        }
        
        const setupMessage = {
          setup: {
            model: modelIdentifier,
            generationConfig: {
              responseModalities: ['AUDIO'],
              temperature: 1.0,
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: selectedVoice
                  }
                }
              }
            },
            tools: [],
            systemInstruction: {
              parts: [{ text: project.ai_prompt }]
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                silenceDurationMs: 800 // High response speed (0.8s silence)
              }
            }
          }
        };
        console.log("[GEMINI SETUP PAYLOAD]", JSON.stringify(setupMessage, null, 2));
        ws.send(JSON.stringify(setupMessage))
      }

      ws.onmessage = async (event) => {
        try {
          let data = event.data
          if (data instanceof Blob) data = await data.text()
          console.log("[GEMINI RESPONSE ACQUIRED] Raw data bytes:", data.length);
          
          const msg = JSON.parse(data)
          console.log("[GEMINI WS] RAW Message received:", msg); // 모든 수신 데이터 덤프
        
        if (msg.error) {
          console.error("[GEMINI ERROR]", msg.error);
          addLog(`[GEMINI ERROR] ${msg.error.message || JSON.stringify(msg.error)}`)
          stopSession('Gemini API 에러')
          return
        }

        if (msg.setupComplete || msg.setup_complete) {
          setStatus('active')
          addLog('[안내] 멀티모달 세션 활성화. AI 가이드 시작.')
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              realtimeInput: {
                text: "가이드를 시작합니다. 현재 공유된 화면을 보고 상황에 맞는 첫인사와 안내를 짧게 한 문장으로 해줘."
              }
            }))
          }

          const audioCtx = new AudioContext({ sampleRate: 16000 })
          audioCtxRef.current = audioCtx
          await audioCtx.audioWorklet.addModule('/worklets/pcm-processor.js')
          const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor')
          audioWorkletNodeRef.current = workletNode
          
          if (mediaStreamRef.current) {
            audioCtx.createMediaStreamSource(mediaStreamRef.current).connect(workletNode)
          }

          workletNode.port.onmessage = (e) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(e.data)))
              // console.log("[GEMINI] Sending audio frame (base64 length:", base64.length, ")");
              wsRef.current.send(JSON.stringify({ 
                realtimeInput: { 
                  audio: { mime_type: 'audio/pcm;rate=16000', data: base64 } 
                } 
              }))
            }
          }
          frameIntervalRef.current = setInterval(sendVideoFrame, 1000)
        }

        // --- Step 2.3: Handle Tool/Function Calls (Top-level Field) ---
        const tc = msg.toolCall || msg.tool_call
        if (tc && (tc.functionCalls || tc.function_calls)) {
          const fcs = tc.functionCalls || tc.function_calls
          fcs.forEach(fc => {
            if (fc.name === 'save_mission_result') {
              const args = fc.args || {}
              const mission_id = args.mission_id || args.missionId
              const type = args.type
              const status = args.status
              
              // --- 강화된 유연한 데이터 추출 로직 ---
              // 1. 우선 result_data 혹은 resultData를 찾음
              let actualResultData = args.result_data || args.resultData || args.result;
              
              // 2. 만약 result_data가 아예 없거나 빈 객체라면, args 자체에서 주요 키들을 찾아봄 (성명, 전화번호, 컨텐츠 등)
              if (!actualResultData || Object.keys(actualResultData).length === 0) {
                const { mission_id: _mid, missionId: _mid2, type: _t, status: _s, stage_id: _sid, ...restArgs } = args;
                if (Object.keys(restArgs).length > 0) {
                  actualResultData = restArgs;
                } else {
                  actualResultData = {};
                }
              }
              
              addLog(`[도구 호출] 'save_mission_result' 감지됨 (id: ${fc.id})`)
              addLog(`[AI ACTION] 미션 결과 저장 시도: ${mission_id} (${status})`)
              console.log("[DB DEBUG] Saving result_data:", actualResultData);
              
              saveMissionResult({
                session_id: project.current_session_id,
                mission_id,
                type,
                status,
                result_data: actualResultData
              }).then(() => {
                addLog(`[시스템] 미션 결과가 성공적으로 DB에 기록되었습니다.`)
                
                // --- Step 2.4: Race Condition 방지 처리 ---
                setCompletedMissions(prev => {
                  const newSet = new Set(prev);
                  if (status === 'success') newSet.add(mission_id);
                  
                  // 업데이트된 셋을 기반으로 피드백 생성 (현재 클로저의 completedMissions가 아닌 최신 prev 기반)
                  const currentStages = project.missions; 
                  const stage = currentStages[currentStageIndex];
                  const requiredMissions = stage.missions.filter(m => m.is_required);
                  const missingRequired = requiredMissions.filter(m => !newSet.has(m.id) && m.id !== mission_id);
                  
                  let toolResult = { result: "success", saved_id: mission_id };
                  if (missingRequired.length > 0) {
                    toolResult.feedback = `현재 단계를 계속 진행하세요. 아직 누락된 필수 항목들이 있습니다: ${missingRequired.map(m => m.title).join(', ')}`;
                    toolResult.is_stage_cleared = false;
                  } else {
                    if (currentStageIndex < currentStages.length - 1) {
                      const nextStage = currentStages[currentStageIndex + 1];
                      setCurrentStageIndex(idx => idx + 1); // 함수형 업데이트
                      toolResult.feedback = `축하합니다! '${stage.title}' 단계를 완료했습니다. 이제 다음 단계인 '${nextStage.title}'로 넘어가세요. 지침: ${nextStage.instructions}`;
                      toolResult.is_stage_cleared = true;
                    } else {
                      toolResult.feedback = "모든 단계의 미션을 완수했습니다. 가이드를 종료하거나 최종 확인 후 마무리하세요.";
                      toolResult.is_all_cleared = true;
                    }
                  }

                  // Send Response (최신 상태 기반 피드백 전송)
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      toolResponse: {
                        functionResponses: [{
                          name: "save_mission_result",
                          response: toolResult,
                          id: fc.id
                        }]
                      }
                    }))
                    addLog(`[네트워크] AI에게 도구 응답 전송 완료 (피드백: ${toolResult.feedback})`);
                  }

                  return newSet;
                });
              }).catch(err => {
                console.error("Failed to save mission result:", err)
                addLog(`[에러] 미션 저장 실패: ${err.message}`)
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: [{
                        name: "save_mission_result",
                        response: { result: "error", message: err.message },
                        id: fc.id
                      }]
                    }
                  }))
                }
              })
            }
          })
        }

        const sc = msg.server_content || msg.serverContent
        if (sc) {
          if (sc.model_turn || sc.modelTurn) {
            const mt = sc.model_turn || sc.modelTurn
            if (mt.parts) {
              mt.parts.forEach((p, idx) => {
                if (p.text) {
                  console.log(`[GEMINI] Received text part [${idx}]:`, p.text);
                  addLog(`[AI TEXT PART] ${p.text}`)
                }
              })
            }
          }
          if (sc.input_audio_transcription || sc.inputTranscription) {
            const trans = sc.input_audio_transcription || sc.inputTranscription
            if (trans.text) {
              console.log("[GEMINI] User Speech Transcript:", trans.text);
              transcriptRef.current.user = trans.text;
              setTranscript(prev => ({ ...prev, user: trans.text }))
            }
          }
          
          if (sc.output_audio_transcription || sc.outputTranscription) {
            const outTrans = sc.output_audio_transcription || sc.outputTranscription
            if (outTrans.text) {
              console.log("[GEMINI] AI Speech Transcript Segment:", outTrans.text);
              transcriptRef.current.assistant += outTrans.text;
              setTranscript(prev => ({ 
                ...prev, 
                assistant: prev.assistant + outTrans.text 
              }))
            }
          }

          if (sc.turn_complete || sc.turnComplete) {
            console.log("[GEMINI] Turn Complete Signal Received.");
            addLog('[시스템] 턴 종료 신호 수신')
            
            // ref를 직접 사용하여 동기적으로 처리 (React의 비동기 처리 지연 방지)
            const uText = transcriptRef.current.user;
            const aText = transcriptRef.current.assistant;

            if (uText || aText) {
              console.log("[GEMINI] Archiving turn to conversation history.");
              const newMsgs = [];
              if (uText) newMsgs.push({ role: 'user', text: uText, timestamp: Date.now() });
              if (aText) newMsgs.push({ role: 'assistant', text: aText, timestamp: Date.now() });

              setConversation(history => {
                let updatedHistory = [...history];
                newMsgs.forEach(nm => {
                  const lastMsg = updatedHistory[updatedHistory.length - 1];
                  // 중복 체크: 동일한 역할의 동일한 텍스트는 무시
                  if (!(lastMsg && lastMsg.role === nm.role && lastMsg.text === nm.text)) {
                    updatedHistory.push(nm);
                  }
                });
                return updatedHistory;
              });

              // 기록 완료 즉시 ref와 state 비움 (동기적으로 즉시 비워야 다음 신호에서 중복 안됨)
              transcriptRef.current = { user: '', assistant: '' };
              setTranscript({ user: '', assistant: '' });
            }
          }

          if (sc.interrupted) {
            console.warn("[GEMINI] Session Interrupted by user.");
            addLog('[인터럽트] 답변 중단됨')
            stopPlayback()
            
            // 중단 시에도 버퍼 비우고 보관
            const uText = transcriptRef.current.user;
            const aText = transcriptRef.current.assistant;
            
            if (aText) {
              setConversation(history => {
                const last = history[history.length - 1];
                if (!(last && last.role === 'assistant' && last.text === aText)) {
                  return [...history, { role: 'assistant', text: aText, timestamp: Date.now() }];
                }
                return history;
              });
            }
            
            transcriptRef.current = { user: '', assistant: '' };
            setTranscript({ user: '', assistant: '' });
          }
        }

        if (sc?.model_turn?.parts || sc?.modelTurn?.parts) {
          const mt = sc.model_turn || sc.modelTurn
          for (const p of mt.parts) {
            // Audio Playback
            const dataB64 = (p.inline_data || p.inlineData)?.data
            if (dataB64) queuePlayback(dataB64)
            
            if (p.function_call || p.functionCall) {
              const fc = p.function_call || p.functionCall
              addLog(`[도구 호출] '${fc.name}' 감지됨 (id: ${fc.id})`)
              
              if (fc.name === 'save_mission_result') {
                const args = fc.args || {};
                const { stage_id, mission_id, type, status, result_data, resultData, content } = args;
                
                // 보조 추출 로직
                let actualData = result_data || resultData || (content ? { content } : null);
                if (!actualData) {
                  const { stage_id: _sid, mission_id: _mid, type: _t, status: _s, ...rest } = args;
                  actualData = rest;
                }

                addLog(`[AI ACTION] 미션 결과 저장 시도: ${mission_id} (상태: ${status})`)
                
                addLog(`[DB] Supabase 저장 요청 전송 중...`)
                // Save to DB
                saveMissionResult({
                  session_id: project.current_session_id,
                  mission_id: mission_id || args.missionId,
                  type,
                  status,
                  result_data: actualData || {}
                }).then(() => {
                  addLog(`[시스템] 미션 결과가 성공적으로 DB에 기록되었습니다.`)
                  
                  // Stage Guard Logic
                  const currentStages = project.missions; // 'missions' key now holds stages array
                  const stage = currentStages[currentStageIndex];
                  
                  // Mark as completed locally
                  const newCompleted = new Set(completedMissions);
                  if (status === 'success') newCompleted.add(mission_id);
                  setCompletedMissions(newCompleted);

                  // Check if all required missions in current stage are done
                  const requiredMissions = stage.missions.filter(m => m.is_required);
                  const missingRequired = requiredMissions.filter(m => !newCompleted.has(m.id) && m.id !== mission_id);
                  
                  let toolResponse = { result: "success", saved_id: mission_id };

                  if (missingRequired.length > 0) {
                    toolResponse.feedback = `현재 단계를 계속 진행하세요. 아직 누락된 필수 항목들이 있습니다: ${missingRequired.map(m => m.title).join(', ')}`;
                    toolResponse.is_stage_cleared = false;
                  } else {
                    // Stage cleared!
                    if (currentStageIndex < currentStages.length - 1) {
                      const nextStage = currentStages[currentStageIndex + 1];
                      setCurrentStageIndex(prev => prev + 1);
                      toolResponse.feedback = `축하합니다! '${stage.title}' 단계를 완료했습니다. 이제 다음 단계인 '${nextStage.title}'로 넘어가세요. 지침: ${nextStage.instructions}`;
                      toolResponse.is_stage_cleared = true;
                      toolResponse.next_stage = nextStage.title;
                    } else {
                      toolResponse.feedback = "모든 단계의 미션을 완수했습니다. 가이드를 종료하거나 최종 확인 후 마무리하세요.";
                      toolResponse.is_all_cleared = true;
                    }
                  }

                  // Send response back to model
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      toolResponse: {
                        functionResponses: [{
                          name: "save_mission_result",
                          response: toolResult,
                          id: fc.id
                        }]
                      }
                    }))
                    addLog(`[네트워크] AI에게 도구 응답 전송 완료 (피드백: ${toolResult.feedback})`);
                  }
                }).catch(err => {
                  console.error("Failed to save mission result:", err)
                  addLog(`[에러] 미션 저장 실패: ${err.message}`)
                  // Send error response
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      toolResponse: {
                        functionResponses: [{
                          name: "save_mission_result",
                          response: { result: "error", message: err.message },
                          id: fc.id
                        }]
                      }
                    }))
                  }
                })
              }
            }
          }
        }
        } catch (err) {
          console.error("[GEMINI PARSE ERROR]", err);
          addLog(`[시스템] 데이터 처리 에러: ${err.message}`);
        }
      }

      ws.onerror = (e) => console.error("[GEMINI WS] Error", e)
      ws.onclose = (e) => {
        if (status !== 'idle') {
          addLog(`[시스템] 연결 종료.`)
          stopSession('연결 끊김')
        }
      }
    } catch (err) {
      addLog(`[크리티컬] ${err.message}`)
      setStatus('idle')
    }
  }, [addLog, stopSession, stopPlayback, videoElementId, sendVideoFrame, status])

  const queuePlayback = (base64) => {
    console.log("[GEMINI] Audio segment queued for playback (length:", base64.length, ")");
    const audioCtx = audioCtxRef.current
    if (!audioCtx) return
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const pcm16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(pcm16.length)
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0
    const buffer = audioCtx.createBuffer(1, float32.length, 24000)
    buffer.copyToChannel(float32, 0)
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    activeSourcesRef.current.push(source)
    
    // Jitter buffer (50ms) for smooth playback
    const lookAhead = 0.05
    const startAt = Math.max(audioCtx.currentTime + lookAhead, playbackScheduledAtRef.current)
    source.start(startAt)
    playbackScheduledAtRef.current = startAt + buffer.duration
    setIsSpeaking(true)
    source.onended = () => {
       activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source)
       if (audioCtxRef.current && audioCtxRef.current.currentTime >= playbackScheduledAtRef.current) {
          setIsSpeaking(false)
       }
    }
  }

  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      if (wsRef.current) wsRef.current.close()
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop())
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  return { 
    status, isSpeaking, logs, setLogs, startSession, stopSession, 
    transcript, conversation, setConversation, 
    currentStageIndex, completedMissions 
  }
}
