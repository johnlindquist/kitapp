/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */
import { ipcMain } from 'electron';
import log from 'electron-log';
import { isUndefined } from 'lodash';
import { emitter, EVENT } from './events';

import { processMap, ChildInfo } from './state';
import {
  escapePromptWindow,
  resizePrompt,
  sendToPrompt,
  hideEmitter,
  hidePromptWindow,
  setPlaceholder,
} from './prompt';
import { setAppHidden, getAppHidden } from './appHidden';
import { Channel } from './enums';

export const reset = (resetPid?: number) => {
  let mapPid = resetPid || 0;

  // only 'kit' scripts will cancel previous kit scripts
  if (!mapPid) {
    for (const [pid, value] of processMap.entries()) {
      if (value.type === 'kit') {
        mapPid = pid;
      }
    }
  }
  if (processMap.has(mapPid)) {
    const { child, scriptPath } = processMap.get(mapPid) as ChildInfo;

    emitter.emit(EVENT.RESUME_SHORTCUTS);
    sendToPrompt(Channel.RESET_PROMPT, { kitScript: scriptPath });

    child?.removeAllListeners();
    child?.kill();
  }

  setAppHidden(false);
};

hideEmitter.on('hide', () => {
  if (getAppHidden()) {
    setAppHidden(false);
  } else {
    reset();
    hidePromptWindow();
  }
});

ipcMain.on(Channel.VALUE_SUBMITTED, (_event, { value, pid }) => {
  if (processMap.has(pid)) {
    const { child, values } = processMap.get(pid) as ChildInfo;
    console.log(`PID CHECK:`, child?.pid, { pid, value });
    emitter.emit(EVENT.RESUME_SHORTCUTS);
    values.push(value);
    if (child) {
      child?.send({ channel: Channel.VALUE_SUBMITTED, value });
    }
  }
});

ipcMain.on(Channel.GENERATE_CHOICES, (_event, { input, pid }) => {
  if (processMap.has(pid)) {
    const { child } = processMap.get(pid) as ChildInfo;

    if (child && !isUndefined(input)) {
      child?.send({ channel: Channel.GENERATE_CHOICES, input });
    }
  }
});

ipcMain.on(Channel.PROMPT_ERROR, (_event, { error }) => {
  log.warn(error);
  if (!getAppHidden()) setPlaceholder(error.message);
});

ipcMain.on(Channel.CHOICE_FOCUSED, (_event, { index, pid }) => {
  if (processMap.has(pid)) {
    const { child } = processMap.get(pid) as ChildInfo;

    if (child && !isUndefined(index)) {
      console.log(`Sending CHOICE_FOCUSED ${index}`);
      child?.send({ channel: Channel.CHOICE_FOCUSED, index });
    }
  }
});

ipcMain.on(Channel.TAB_CHANGED, (event, { tab, input = '', pid }) => {
  emitter.emit(EVENT.RESUME_SHORTCUTS);
  if (processMap.has(pid)) {
    const { child } = processMap.get(pid) as ChildInfo;
    if (child && tab) {
      child?.send({ channel: Channel.TAB_CHANGED, tab, input });
    }
  }
});

ipcMain.on(Channel.CONTENT_SIZE_UPDATED, (event, size) => {
  if (!isUndefined(size)) {
    resizePrompt(size);
  }
});

ipcMain.on(Channel.ESCAPE_PRESSED, (event, { pid }) => {
  reset(pid);
  escapePromptWindow();
});
