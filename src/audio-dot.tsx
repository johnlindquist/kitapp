/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Channel } from '@johnlindquist/kit/cjs/enum';
import os from 'os';
import path from 'path';
import { writeFileSync } from 'fs';
import log from 'electron-log';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ipcRenderer } from 'electron';
import {
  channelAtom,
  submitValueAtom,
  micIdAtom,
  logAtom,
  uiAtom,
  openAtom,
  micConfigAtom,
  audioDotAtom,
} from './jotai';
import useOnEnter from './hooks/useOnEnter';

function arrayBufferToBase64(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64 = window.btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

export default function AudioDot() {
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [, submit] = useAtom(submitValueAtom);
  const deviceId = useAtomValue(micIdAtom);
  const [volume, setVolume] = useState(0);
  const ui = useAtomValue(uiAtom);
  const open = useAtomValue(openAtom);
  const micConfig = useAtomValue(micConfigAtom);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [channel] = useAtom(channelAtom);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const setAudioDot = useSetAtom(audioDotAtom);

  const handleDataAvailable = useCallback(
    async (event) => {
      setAudioChunks((prevAudioChunks) => [...prevAudioChunks, event.data]);
      if (micConfig.stream) {
        const arrayBuffer = await event.data.arrayBuffer();
        const type = `audio/${micConfig.format}`;

        const base64 = arrayBufferToBase64(arrayBuffer, type);
        channel(Channel.ON_AUDIO_DATA, {
          value: base64,
        });
      }
    },
    [channel, micConfig.format, micConfig.stream]
  );

  const handleStop = useCallback(() => {
    // console.log.info('Stopped recording');

    if (recorderRef.current === null) return;
    recorderRef.current.removeEventListener(
      'dataavailable',
      handleDataAvailable
    );
    recorderRef.current.removeEventListener('stop', handleStop);
    recorderRef.current = null;
  }, [handleDataAvailable]);

  const destroyRecorder = useCallback(() => {
    log.info(typeof recorderRef?.current);
    if (recorderRef?.current) {
      log.info(`Destroying recorder...`);
      recorderRef.current.stream.getTracks().forEach((track) => track.stop());
      recorderRef.current.removeEventListener('stop', handleStop);
      recorderRef.current.removeEventListener(
        'dataavailable',
        handleDataAvailable
      );
      recorderRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [handleDataAvailable, handleStop]);

  const stopRecording = useCallback(async () => {
    if (recorderRef.current !== null) {
      log.info(`🎙 Stopping recording...`);
      if (recorderRef.current.state === 'recording') recorderRef.current.stop();
      // destroy the recorder
      log.info(`Destroying recorder because stop...`);
      destroyRecorder();
      log.info(`Audio chunks: ${audioChunks.length}`);
      if (audioChunks.length === 0) return;
      const type = `audio/webm;codecs=opus`;
      const audioBlob = new Blob(audioChunks, {
        type,
      });

      log.info(`Submitting audio...`);

      const tmpFileName = path.join(
        os.tmpdir(),
        `recording_${Math.random().toString(36).substring(7)}.webm`
      );
      writeFileSync(tmpFileName, Buffer.from(await audioBlob.arrayBuffer()));
      log.info(`Audio written to temporary file: ${tmpFileName}`);

      log.info(`Submitting audio...`);

      channel(Channel.START_MIC, { value: tmpFileName });
      setAudioChunks([]);
      setAudioDot(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioChunks, submit]);

  const startRecording = useCallback(async () => {
    if (recorderRef.current === null) return;
    log.info(`🎤 Starting recording...`);

    log.info(`Got recorder... ${recorderRef.current}`);
    recorderRef.current.addEventListener('dataavailable', handleDataAvailable);
    recorderRef.current.addEventListener('stop', handleStop);
    recorderRef.current.start(micConfig.timeSlice);

    audioContextRef.current = new AudioContext();
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContextRef.current.createMediaStreamSource(
      recorderRef.current.stream
    );
    source.connect(analyser);

    const analyzeVolume = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const avg = sum / dataArray.length;

      setVolume(avg);

      if (recorderRef.current && recorderRef.current.state === 'recording') {
        requestAnimationFrame(analyzeVolume);
      }
    };

    analyzeVolume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => {
    if (open && recorderRef.current === null) {
      const constraints = {
        audio: deviceId ? { deviceId } : true,
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);

          recorderRef.current = mediaRecorder;
          startRecording();
          return null;
        })
        .catch((err) => {
          log.info(`Error connecting to mic... ${err}`);
        });
    }
  }, [open, deviceId, startRecording]);

  useEffect(() => {
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (
        recorderRef.current !== null &&
        recorderRef.current.state === 'recording'
      ) {
        recorderRef.current.stop();
        log.info(`Mic unmounted. Stopping tracks and clearing audio chunks...`);
        destroyRecorder();
        setAudioChunks([]);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStopMic = () => {
      log.info(`>>> Handling stop mic...`);
      stopRecording();
    };

    ipcRenderer.on(Channel.STOP_MIC, handleStopMic);

    return () => {
      ipcRenderer.removeListener(Channel.STOP_MIC, handleStopMic);
    };
  }, [stopRecording]);

  useOnEnter(stopRecording);

  return (
    <div
      onClick={() => {
        stopRecording();
      }}
      className="absolute top-0 right-0 m-1.5 h-1.5 w-1.5 rounded-full"
      style={{
        backgroundColor: `hsl(${volume * 2}, 100%, 50%, 1)`,
      }}
    />
  );
}
