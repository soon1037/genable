'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from './supabase'
import { saveMissionResult, updateSession } from '@/lib/db'

export function useGeminiLiveHook(videoElementId) {
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState({ user: '', assistant: '' })
  const [conversation, setConversation] = useState([]) // [{ role: 'user' | 'assistant', text: string, timestamp: number }]
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [completedMissions, setCompletedMissions] = useState(new Set())
  
  const wsRef = useRef(null)
  const audioCtxRef = useRef(null) // 16kHz for input
  const playbackAudioCtxRef = useRef(null) // 24kHz for output
  const mediaStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const transcriptRef = useRef({ user: '', assistant: '' })
  const audioWorkletNodeRef = useRef(null)
  const playbackScheduledAtRef = useRef(0)
  const canvasRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const activeSourcesRef = useRef([])
  const usageRef = useRef({ input: 0, output: 0 })
  const contextRef = useRef({ projectId: null, sessionId: null, companyId: null })
  const missionMappingRef = useRef({}) // { alias: originalId }
  const sessionStartTimeRef = useRef(0)
  const genRateRef = useRef(0.1) // Default to 0.1 if fetch fails

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev, msg])
  }, [])

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { 
        source.stop(0)
        source.disconnect()
      } catch (e) {}
    })
    activeSourcesRef.current = []
    if (playbackAudioCtxRef.current) {
      playbackScheduledAtRef.current = playbackAudioCtxRef.current.currentTime
    }
    setIsSpeaking(false)
  }, [])

  const stopSession = useCallback(async (reason = '사용자 요청') => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    stopPlayback()

    // --- Final AI Usage & Status Logging ---
    const finalUsage = usageRef.current;
    if (contextRef.current.sessionId) {
      try {
        const RATE_INPUT = 0.75;
        const RATE_OUTPUT = 1.50;
        const KRW_USD_RATE = 1350;

        const costUsd = (finalUsage.input * (RATE_INPUT / 1000000)) + (finalUsage.output * (RATE_OUTPUT / 1000000));
        const costKrw = Math.round(costUsd * KRW_USD_RATE);

        // --- Gen Token Deduction (Dynamic Pricing) ---
        const durationSeconds = (Date.now() - sessionStartTimeRef.current) / 1000;
        // 🎯 Charge per WHOLE second to avoid messy floating point remainders (.xxx)
        const genConsumed = Math.max(0, Math.ceil(durationSeconds) * (genRateRef.current || 0.1));
        
        const { data: { session: authSess } } = await supabase.auth.getSession();
        
        // 1. Atomic deduction from company balance
        if (contextRef.current.companyId && genConsumed > 0) {
          supabase.rpc('deduct_gens', { 
            target_company_id: contextRef.current.companyId, 
            amount: genConsumed 
          }).then(({ data, error }) => {
            if (error) console.error("[GEN DEDUCTION ERROR]", error);
            else console.log(`[GEN DEDUCTION SUCCESS] Remaining Balance: ${data} Gen`);
          });
        }

        // 2. 비용 로그 저장
        if (finalUsage.input > 0 || genConsumed > 0) {
          await supabase.from('usage_logs').insert([{
            service_type: 'live',
            model_name: 'gemini-3.1-flash-live-preview',
            input_tokens: finalUsage.input,
            output_tokens: finalUsage.output,
            cost_usd: costUsd,
            cost_krw: costKrw,
            gen_consumed: genConsumed,
            unit_rate_applied: genRateRef.current,
            user_id: authSess?.user?.id || null,
            session_id: contextRef.current.sessionId,
            project_id: contextRef.current.projectId
          }]);
        }

        // 3. 세션 최종 종료 상태 업데이트
        await supabase.from('sessions').update({
          status: 'completed',
          ended_at: new Date().toISOString()
        }).eq('id', contextRef.current.sessionId);

        console.log(`[USAGE LOG] Session completed. Cost: ${costKrw} KRW | Gen Consumed: ${genConsumed.toFixed(2)}`);
      } catch (logErr) {
        console.error("[USAGE LOG ERROR] Live session logging failing:", logErr);
      }
    }

    if (wsRef.current) wsRef.current.close()
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop())
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) audioCtxRef.current.close()
    if (playbackAudioCtxRef.current) playbackAudioCtxRef.current.close()
    
    wsRef.current = null
    mediaStreamRef.current = null
    screenStreamRef.current = null
    audioCtxRef.current = null
    playbackAudioCtxRef.current = null
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
      
      // Reset usage for new session
      usageRef.current = { input: 0, output: 0 };
      contextRef.current = { 
        projectId: project.id, 
        sessionId: project.current_session_id,
        companyId: project.company_id
      };
      sessionStartTimeRef.current = Date.now();

      // Fetch dynamic pricing for Genable Live
      supabase.from('service_pricing')
        .select('gen_per_unit')
        .eq('service_name', 'genable-live')
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            genRateRef.current = data.gen_per_unit;
            console.log(`[PRICING] Dynamic rate loaded: ${data.gen_per_unit} Gen/sec`);
          }
        });

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
        addLog('[시스템] 소켓 연결 성공. 설정 전송 중...')
        
        let selectedVoice = project.voice_id || 'Puck';
        if (selectedVoice.startsWith('voice-')) {
          console.warn(`[GEMINI WS] Invalid voice ID detected: ${selectedVoice}. Falling back to 'Puck'.`);
          selectedVoice = 'Puck';
        }
        
        // 3. Mission ID Aliasing for AI reliability
        const missionMapping = {};
        let missionCounter = 1;
        let missionDesc = "";
        
        if (project.missions && Array.isArray(project.missions)) {
          project.missions.forEach((stage, sIdx) => {
            if (stage.missions && Array.isArray(stage.missions)) {
              stage.missions.forEach(m => {
                const alias = `mission_${missionCounter++}`;
                missionMapping[alias] = m.id;
                missionDesc += `- ${alias}: ${m.title} (Type: ${m.type})\n`;
              });
            }
          });
        }
        missionMappingRef.current = missionMapping;

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
            tools: [{
              functionDeclarations: [
                {
                  name: "save_mission_result",
                  description: "사용자와의 대화 중 미션의 결과를 저장하거나 수집된 정보를 기록합니다. 반드시 지정된 mission_id 별칭을 사용하세요.",
                  parameters: {
                    type: "object",
                    properties: {
                      stage_id: { type: "string", description: "현재 수행 중인 단계의 아이디" },
                      mission_id: { type: "string", description: "지정된 별칭 (예: mission_1, mission_2)" },
                      type: { type: "string", enum: ["guide", "verify", "collect"], description: "미션의 유형" },
                      status: { type: "string", enum: ["success", "failure", "pending"], description: "수행 상태" },
                      result_data: { 
                        type: "object", 
                        description: "수집된 정보. 가급적 { 'value': '내용' } 형식을 사용하세요.",
                        properties: {
                          value: { type: "string", description: "수집된 핵심 내용" }
                        }
                      }
                    },
                    required: ["stage_id", "mission_id", "type", "status"]
                  }
                }
              ]
            }],
            systemInstruction: {
              parts: [{ text: `${project.ai_prompt}\n\n### DATA COLLECTION GUIDELINES\n반드시 아래의 mission_id 별칭을 사용하여 'save_mission_result'를 호출하세요. 핵심 데이터는 result_data의 'value' 키를 사용해 저장하세요.\n${missionDesc}` }]
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                silenceDurationMs: 800
              }
            }
          }
        };
        ws.send(JSON.stringify(setupMessage))

        // Save session setup configuration (including AI prompt) to DB for record keeping
        if (contextRef.current.sessionId) {
          supabase.from('sessions').update({ metadata: setupMessage }).eq('id', contextRef.current.sessionId).then(({ error }) => {
            if (error) console.error("[METADATA SYNC ERROR]", error);
            else console.log("[METADATA SYNC SUCCESS] Prompt & Config persisted to session record.");
          });
        }
      }

      ws.onmessage = async (event) => {
        try {
          let data = event.data
          if (data instanceof Blob) data = await data.text()
          const msg = JSON.parse(data)
        
          if (msg.error) {
            console.error("[GEMINI ERROR]", msg.error);
            addLog(`[GEMINI ERROR] ${msg.error.message || JSON.stringify(msg.error)}`)
            stopSession('Gemini API 에러')
            return
          }

          if (msg.setupComplete || msg.setup_complete) {
            setStatus('active')
            addLog('[안내] 멀티모달 세션 활성화. AI 가이드 시작.')
            
            const audioCtx = new AudioContext({ sampleRate: 16000 })
            audioCtxRef.current = audioCtx
            
            const playbackCtx = new AudioContext({ sampleRate: 24000 })
            playbackAudioCtxRef.current = playbackCtx
            playbackScheduledAtRef.current = playbackCtx.currentTime

            await audioCtx.audioWorklet.addModule('/worklets/pcm-processor.js')
            const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor')
            audioWorkletNodeRef.current = workletNode
            
            if (mediaStreamRef.current) {
              audioCtx.createMediaStreamSource(mediaStreamRef.current).connect(workletNode)
            }

            workletNode.port.onmessage = (e) => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(e.data)))
                wsRef.current.send(JSON.stringify({ 
                  realtimeInput: { 
                    audio: { mime_type: 'audio/pcm;rate=16000', data: base64 } 
                  } 
                }))
              }
            }
            frameIntervalRef.current = setInterval(sendVideoFrame, 1000)

            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                realtimeInput: {
                  text: "가이드를 시작합니다. 현재 공유된 화면을 보고 상황에 맞는 첫인사와 안내를 짧게 한 문장으로 해줘."
                }
              }))
            }
          }

          const processFunctionCall = (fc) => {
            if (fc.name === 'save_mission_result') {
              const args = fc.args || {}
              let mission_id_alias = args.mission_id || args.missionId
              const type = args.type
              const status = args.status
              const originalId = missionMappingRef.current[mission_id_alias] || mission_id_alias;
              
              let actualData = args.result_data || args.resultData || args.result;
              if (!actualData || Object.keys(actualData).length === 0) {
                const { stage_id, mission_id, missionId, type: _t, status: _s, ...rest } = args;
                actualData = rest;
              }
              if (actualData && !actualData.value && Object.keys(actualData).length === 1) {
                const firstKey = Object.keys(actualData)[0];
                actualData = { value: actualData[firstKey] };
              }

              addLog(`[도구 호출] 'save_mission_result' 감지됨`)
              saveMissionResult({
                session_id: project.current_session_id,
                mission_id: originalId,
                type,
                status,
                result_data: actualData || {}
              }).then(() => {
                addLog(`[시스템] 미션 결과가 저장되었습니다.`)
                setCompletedMissions(prev => {
                  const newSet = new Set(prev);
                  if (status === 'success') newSet.add(originalId);
                  
                  const stage = project.missions[currentStageIndex];
                  const required = stage.missions.filter(m => m.is_required);
                  const missing = required.filter(m => !newSet.has(m.id) && m.id !== originalId);
                  
                  let toolResult = { result: "success", saved_id: originalId };
                  if (missing.length > 0) {
                    toolResult.feedback = `진행 중입니다. 아직 누락된 항목: ${missing.map(m => m.title).join(', ')}`;
                    toolResult.is_stage_cleared = false;
                  } else if (currentStageIndex < project.missions.length - 1) {
                    setCurrentStageIndex(idx => idx + 1);
                    toolResult.feedback = `단계 완료! 다음 단계로 넘어가세요.`;
                    toolResult.is_stage_cleared = true;
                  } else {
                    toolResult.feedback = "모든 미션 완료!";
                    toolResult.is_all_cleared = true;
                  }

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
                  }
                  return newSet;
                });
              }).catch(err => {
                addLog(`[에러] 저장 실패: ${err.message}`)
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({
                    toolResponse: { functionResponses: [{ name: "save_mission_result", response: { error: err.message }, id: fc.id }] }
                  }))
                }
              })
            }
          };

          const tc = msg.toolCall || msg.tool_call
          if (tc && (tc.functionCalls || tc.function_calls)) {
            (tc.functionCalls || tc.function_calls).forEach(processFunctionCall);
          }

          const sc = msg.server_content || msg.serverContent
          if (sc) {
            if (sc.model_turn || sc.modelTurn) {
              const mt = sc.model_turn || sc.modelTurn
              mt.parts?.forEach(p => {
                const dataB64 = (p.inline_data || p.inlineData)?.data
                if (dataB64) queuePlayback(dataB64)
                if (p.function_call || p.functionCall) processFunctionCall(p.function_call || p.functionCall);
                
                // Capture text from modelTurn parts (if mirrored or explicitly sent as text)
                if (p.text && p.text.trim()) {
                  if (mt.role === 'user') {
                    transcriptRef.current.user = p.text;
                    setTranscript(prev => ({ ...prev, user: p.text }));
                  } else {
                    transcriptRef.current.assistant += p.text;
                    setTranscript(prev => ({ ...prev, assistant: prev.assistant + p.text }));
                  }
                }
              })
            }
            if (sc.input_audio_transcription || sc.inputTranscription) {
              const text = (sc.input_audio_transcription || sc.inputTranscription).text
              if (text) {
                transcriptRef.current.user = text;
                setTranscript(prev => ({ ...prev, user: text }))
              }
            }
            if (sc.output_audio_transcription || sc.outputTranscription) {
              const text = (sc.output_audio_transcription || sc.outputTranscription).text
              if (text) {
                transcriptRef.current.assistant += text;
                setTranscript(prev => ({ ...prev, assistant: prev.assistant + text }))
              }
            }
            if (sc.turn_complete || sc.turnComplete) {
              const uText = transcriptRef.current.user;
              const aText = transcriptRef.current.assistant;
              if (uText || aText) {
                setConversation(history => {
                  const newMessages = [];
                  if (uText) newMessages.push({ role: 'user', text: uText, timestamp: new Date().toISOString() });
                  if (aText) newMessages.push({ role: 'assistant', text: aText, timestamp: new Date().toISOString() });
                  
                  if (newMessages.length === 0) return history;

                  const nextHistory = [...history, ...newMessages];
                  if (contextRef.current.sessionId) {
                    supabase.from('sessions').update({ transcript: nextHistory }).eq('id', contextRef.current.sessionId);
                  }
                  return nextHistory;
                });
                transcriptRef.current = { user: '', assistant: '' };
                setTranscript({ user: '', assistant: '' });
              }
            }
            if (sc.interrupted) {
              addLog('[인터럽트] 중단됨')
              stopPlayback()
              transcriptRef.current = { user: '', assistant: '' };
              setTranscript({ user: '', assistant: '' });
            }
          }

          const usage = msg.usageMetadata || msg.usage_metadata || sc?.usageMetadata || sc?.usage_metadata;
          if (usage) {
            const input = usage.promptTokenCount || usage.prompt_token_count || usage.promptTokens || 0;
            // Support responseTokenCount which is used by Multimodal Live v1alpha
            const output = usage.candidatesTokenCount || usage.candidates_token_count || usage.candidatesTokens || usage.responseTokenCount || usage.response_token_count || 0;
            const total = usage.totalTokenCount || usage.total_token_count || usage.totalTokens || (input + output);
            
            usageRef.current = { input, output };
            
            // LOGGING FREQUENCY OPTIMIZATION: 
            // Only insert into DB when a turn is complete (sc.turnComplete) 
            // or when it's the final total usage of the session.
            if (contextRef.current.sessionId && total > 0 && (sc?.turnComplete || !sc)) {
              const usdCost = (input * 0.75 / 1000000) + (output * 1.50 / 1000000);
              const krwCost = Math.round(usdCost * 1350);
              
              supabase.from('usage_logs').insert([{
                service_type: 'live', 
                model_name: 'gemini-3.1-flash-live-preview',
                input_tokens: input, 
                output_tokens: output, 
                cost_usd: usdCost.toFixed(6),
                cost_krw: krwCost,
                session_id: contextRef.current.sessionId, 
                project_id: contextRef.current.projectId,
                metadata: { is_incremental: true, total_tokens: total, raw_usage: usage }
              }]).then(({ error }) => {
                if (error) {
                  console.error("[USAGE LOG ERROR] Insertion failed:", error);
                } else {
                  console.log("[USAGE LOG SUCCESS] Log entry created (Cumulative).");
                }
              });
            } else if (!contextRef.current.sessionId) {
              console.warn("[GEMINI USAGE] Log skipping - Missing Session ID in contextRef.");
            }
          }
        } catch (err) {
          console.error("[GEMINI PARSE ERROR]", err);
        }
      };

      ws.onerror = (ev) => {
        console.error("[GEMINI WS ERROR]", ev);
        addLog(`[시스템] 소켓 오류가 발생했습니다.`);
      };

      ws.onclose = (ev) => { 
        console.log(`[GEMINI WS CLOSE] Code: ${ev.code}, Reason: ${ev.reason}`);
        if (status !== 'idle') stopSession(`연결 종료 (코드: ${ev.code})`) 
      };
    } catch (err) {
      addLog(`[크리티컬] ${err.message}`)
      setStatus('idle')
    }
  }, [addLog, stopSession, stopPlayback, videoElementId, sendVideoFrame, status, currentStageIndex])

  const queuePlayback = (base64) => {
    const audioCtx = playbackAudioCtxRef.current
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
    const startAt = Math.max(audioCtx.currentTime + 0.05, playbackScheduledAtRef.current)
    source.start(startAt)
    playbackScheduledAtRef.current = startAt + buffer.duration
    setIsSpeaking(true)
    source.onended = () => {
       activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source)
       if (audioCtx.currentTime >= playbackScheduledAtRef.current) setIsSpeaking(false)
    }
  }

  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      if (wsRef.current) wsRef.current.close()
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop())
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())
      if (audioCtxRef.current) audioCtxRef.current.close()
      if (playbackAudioCtxRef.current) playbackAudioCtxRef.current.close()
    }
  }, [])

  return { status, isSpeaking, logs, setLogs, startSession, stopSession, transcript, conversation, setConversation, currentStageIndex, completedMissions }
}
